import { ApprovedSource } from '../app/types'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

// Schema for discovered sources
const DiscoveredSourceSchema = z.object({
  domain: z.string(),
  name: z.string(),
  description: z.string(),
  relevance: z.number().min(0).max(1),
  credibility: z.number().min(0).max(1),
  dataTypes: z.array(z.string()),
  reasoning: z.string()
})

const SourceDiscoveryResponseSchema = z.object({
  sources: z.array(DiscoveredSourceSchema),
  searchQueries: z.array(z.string()),
  keyTerms: z.array(z.string())
})

export interface SourceDiscoveryOptions {
  maxSources?: number
  minCredibility?: number
  includeAcademic?: boolean
  includeGovernment?: boolean
  includeIndustry?: boolean
  sector?: string
  openaiApiKey?: string
}

export class AISourceDiscovery {
  private openai: any
  private discoveredSources: Map<string, ApprovedSource> = new Map()
  private sourceQualityCache: Map<string, number> = new Map()

  constructor(apiKey?: string) {
    if (apiKey || process.env.OPENAI_API_KEY) {
      this.openai = createOpenAI({
        apiKey: apiKey || process.env.OPENAI_API_KEY
      })
    }
  }

  async discoverSources(
    query: string, 
    existingSources: ApprovedSource[],
    options: SourceDiscoveryOptions = {}
  ): Promise<ApprovedSource[]> {
    if (!this.openai) {
      console.error('OpenAI API key not configured for source discovery')
      return []
    }

    try {
      // First, analyze the query to understand what type of sources would be best
      const discoveryPrompt = this.buildDiscoveryPrompt(query, existingSources, options)
      
      const response = await generateObject({
        model: this.openai('gpt-4-turbo-preview'),
        schema: SourceDiscoveryResponseSchema,
        prompt: discoveryPrompt,
        temperature: 0.7,
      })

      // Convert discovered sources to ApprovedSource format
      const newSources: ApprovedSource[] = []
      
      for (const discovered of response.object.sources) {
        if (discovered.credibility >= (options.minCredibility || 0.7)) {
          const approvedSource = this.convertToApprovedSource(discovered, options)
          newSources.push(approvedSource)
          
          // Cache for future use
          this.discoveredSources.set(discovered.domain, approvedSource)
          this.sourceQualityCache.set(discovered.domain, discovered.credibility)
        }
      }

      // Use search queries to find additional sources
      const additionalSources = await this.searchForAdditionalSources(
        response.object.searchQueries,
        response.object.keyTerms,
        options
      )
      
      newSources.push(...additionalSources)

      return this.rankAndFilterSources(newSources, query, options)
    } catch (error) {
      console.error('Error discovering sources:', error)
      return []
    }
  }

  private buildDiscoveryPrompt(
    query: string, 
    existingSources: ApprovedSource[],
    options: SourceDiscoveryOptions
  ): string {
    const existingDomains = existingSources.map(s => s.domain).join(', ')
    
    return `
You are an expert research consultant specializing in finding high-quality data sources.

Query: "${query}"
Sector: ${options.sector || 'General'}
Existing sources: ${existingDomains}

Please discover NEW authoritative sources that would contain relevant data for this query.
Focus on:
1. Government databases and statistics offices
2. Industry associations and trade organizations  
3. Research institutions and think tanks
4. Regulatory bodies and compliance databases
5. Academic research repositories
6. Specialized data providers

For each source, evaluate:
- Relevance to the query (0-1)
- Credibility and authority (0-1)
- Types of data available
- Why this source would be valuable

Also provide:
- Search queries to find more sources
- Key terms specific to this domain

Prioritize sources with:
- Direct data access (APIs, downloads)
- Regular updates
- Historical data
- Industry-specific metrics
`
  }

  private convertToApprovedSource(
    discovered: z.infer<typeof DiscoveredSourceSchema>,
    options: SourceDiscoveryOptions
  ): ApprovedSource {
    return {
      domain: discovered.domain,
      name: discovered.name,
      description: discovered.description,
      contentTypes: this.mapDataTypesToContentTypes(discovered.dataTypes),
      searchCapabilities: this.inferSearchCapabilities(discovered),
      priority: Math.round(discovered.relevance * 10),
      categories: this.inferCategories(discovered, options),
      fileExtensions: this.inferFileExtensions(discovered.dataTypes)
    }
  }

  private mapDataTypesToContentTypes(dataTypes: string[]): ApprovedSource['contentTypes'] {
    const contentTypes: ApprovedSource['contentTypes'] = []
    
    const mapping: Record<string, ApprovedSource['contentTypes'][number]> = {
      'statistics': 'datasets',
      'data': 'datasets',
      'reports': 'reports',
      'research': 'reports',
      'articles': 'articles',
      'spreadsheets': 'spreadsheets',
      'databases': 'datasets',
      'documents': 'documents'
    }

    for (const dataType of dataTypes) {
      const lower = dataType.toLowerCase()
      for (const [key, value] of Object.entries(mapping)) {
        if (lower.includes(key) && !contentTypes.includes(value)) {
          contentTypes.push(value)
        }
      }
    }

    return contentTypes.length > 0 ? contentTypes : ['articles']
  }

  private inferSearchCapabilities(discovered: z.infer<typeof DiscoveredSourceSchema>): ('web' | 'files' | 'spreadsheets' | 'databases')[] {
    const capabilities: ('web' | 'files' | 'spreadsheets' | 'databases')[] = ['web']
    
    if (discovered.dataTypes.some(type => 
      type.toLowerCase().includes('spreadsheet') || 
      type.toLowerCase().includes('excel') ||
      type.toLowerCase().includes('csv')
    )) {
      capabilities.push('spreadsheets')
    }

    if (discovered.dataTypes.some(type => 
      type.toLowerCase().includes('database') || 
      type.toLowerCase().includes('api')
    )) {
      capabilities.push('databases')
    }

    if (discovered.dataTypes.some(type => 
      type.toLowerCase().includes('pdf') || 
      type.toLowerCase().includes('document')
    )) {
      capabilities.push('files')
    }

    return capabilities
  }

  private inferCategories(
    discovered: z.infer<typeof DiscoveredSourceSchema>,
    options: SourceDiscoveryOptions
  ): string[] {
    const categories: string[] = []
    
    if (options.sector) {
      categories.push(options.sector.toLowerCase())
    }

    // Infer from description and name
    const text = `${discovered.name} ${discovered.description}`.toLowerCase()
    
    const categoryKeywords: Record<string, string[]> = {
      'financial': ['financial', 'finance', 'economic', 'monetary'],
      'market-data': ['market', 'trading', 'exchange', 'prices'],
      'research': ['research', 'study', 'analysis', 'report'],
      'regulatory': ['regulatory', 'compliance', 'regulation', 'authority'],
      'industry': ['industry', 'sector', 'association', 'trade'],
      'government': ['government', 'federal', 'bureau', 'department'],
      'academic': ['university', 'academic', 'journal', 'scholarly']
    }

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category)
      }
    }

    return categories
  }

  private inferFileExtensions(dataTypes: string[]): string[] {
    const extensions: string[] = []
    
    const extensionMapping: Record<string, string[]> = {
      'pdf': ['.pdf'],
      'excel': ['.xlsx', '.xls'],
      'csv': ['.csv'],
      'json': ['.json'],
      'xml': ['.xml'],
      'document': ['.pdf', '.docx', '.doc']
    }

    for (const dataType of dataTypes) {
      const lower = dataType.toLowerCase()
      for (const [key, exts] of Object.entries(extensionMapping)) {
        if (lower.includes(key)) {
          extensions.push(...exts)
        }
      }
    }

    return [...new Set(extensions)]
  }

  private async searchForAdditionalSources(
    searchQueries: string[],
    keyTerms: string[],
    options: SourceDiscoveryOptions
  ): Promise<ApprovedSource[]> {
    // This would integrate with web search to find more sources
    // For now, returning empty array
    return []
  }

  private rankAndFilterSources(
    sources: ApprovedSource[],
    query: string,
    options: SourceDiscoveryOptions
  ): ApprovedSource[] {
    // Rank sources based on relevance and quality
    return sources
      .sort((a, b) => {
        const scoreA = this.calculateSourceScore(a, query)
        const scoreB = this.calculateSourceScore(b, query)
        return scoreB - scoreA
      })
      .slice(0, options.maxSources || 5)
  }

  private calculateSourceScore(source: ApprovedSource, query: string): number {
    let score = source.priority

    // Boost score based on query relevance
    const queryWords = query.toLowerCase().split(/\s+/)
    const sourceText = `${source.name} ${source.description} ${source.categories.join(' ')}`.toLowerCase()
    
    for (const word of queryWords) {
      if (sourceText.includes(word)) {
        score += 1
      }
    }

    // Boost for cached quality scores
    const cachedQuality = this.sourceQualityCache.get(source.domain)
    if (cachedQuality) {
      score += cachedQuality * 5
    }

    return score
  }

  // Learn from successful searches
  async learnFromSearch(
    query: string,
    sources: ApprovedSource[],
    results: any[]
  ): Promise<void> {
    // Analyze which sources provided good results
    for (const result of results) {
      const source = sources.find(s => result.url.includes(s.domain))
      if (source && result.relevanceScore > 0.7) {
        const currentQuality = this.sourceQualityCache.get(source.domain) || 0.5
        const newQuality = currentQuality * 0.8 + result.relevanceScore * 0.2
        this.sourceQualityCache.set(source.domain, newQuality)
      }
    }
  }

  // Get learned source recommendations
  getLearnedRecommendations(sector?: string): ApprovedSource[] {
    const allSources = [
      ...Array.from(this.discoveredSources.values())
    ]

    return allSources
      .filter(source => !sector || source.categories.includes(sector.toLowerCase()))
      .sort((a, b) => {
        const qualityA = this.sourceQualityCache.get(a.domain) || 0.5
        const qualityB = this.sourceQualityCache.get(b.domain) || 0.5
        return qualityB - qualityA
      })
      .slice(0, 10)
  }
}

// Export singleton instance
export const sourceDiscovery = new AISourceDiscovery() 