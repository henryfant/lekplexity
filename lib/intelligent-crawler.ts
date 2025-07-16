import { DataPoint } from './search-strategies'
import FirecrawlApp from '@mendable/firecrawl-js'
import axios from 'axios'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
// import pdf from 'pdf-parse' // Removed static import

export interface CrawlNode {
  url: string
  depth: number
  parent?: string
  relevanceScore: number
  contentType: string
  explored: boolean
}

export interface CrawlOptions {
  maxDepth: number
  maxPages?: number
  followLinks: boolean
  adaptiveDepth: boolean
  dataPatterns?: RegExp[]
  relevanceThreshold?: number
  firecrawlApiKey?: string
  openaiApiKey?: string
}

export interface CrawlResult {
  url: string
  title: string
  content: string
  depth: number
  dataPoints: DataPoint[]
  links: string[]
  fileLinks: string[]
  relevanceScore: number
  metadata: Record<string, any>
}

const ReportSchema = z.object({
  name: z.string().describe("The full name of the report or study."),
  publisher: z.string().optional().describe("The publishing organization or author."),
  year: z.string().optional().describe("The year of publication.")
});

const MentionedReportsSchema = z.object({
  reports: z.array(ReportSchema).describe("An array of mentioned reports.")
});


export class IntelligentCrawler {
  private firecrawl: FirecrawlApp | null = null
  private openai: any | null = null
  private visitedUrls: Set<string> = new Set()
  private crawlQueue: CrawlNode[] = []
  private results: CrawlResult[] = []
  private dataPointsFound: Map<string, DataPoint[]> = new Map()

  constructor(apiKey?: string) {
    if (apiKey) {
      this.firecrawl = new FirecrawlApp({ apiKey })
    }
  }

  async crawl(
    startUrl: string,
    query: string,
    domain: string,
    options: CrawlOptions
  ): Promise<CrawlResult[]> {
    if (!this.firecrawl && options.firecrawlApiKey) {
      this.firecrawl = new FirecrawlApp({ apiKey: options.firecrawlApiKey })
    }
    if (!this.openai && options.openaiApiKey) {
      this.openai = createOpenAI({ apiKey: options.openaiApiKey })
    }

    if (!this.firecrawl) {
      throw new Error('Firecrawl API key required for crawling')
    }

    // Reset state
    this.visitedUrls.clear()
    this.crawlQueue = []
    this.results = []
    this.dataPointsFound.clear()

    // Add initial URL to queue
    this.crawlQueue.push({
      url: startUrl,
      depth: 0,
      relevanceScore: 1.0,
      contentType: 'webpage',
      explored: false
    })

    let pagesProcessed = 0
    const maxPages = options.maxPages || 50

    while (this.crawlQueue.length > 0 && pagesProcessed < maxPages) {
      // Get next URL to crawl (prioritize by relevance and depth)
      const node = this.getNextNode()
      if (!node) break

      if (this.visitedUrls.has(node.url)) continue
      this.visitedUrls.add(node.url)

      try {
        const result = await this.crawlPage(node, query, domain, options)
        if (result) {
          this.results.push(result)
          pagesProcessed++

          // Handle discovered files (directly linked and externally mentioned)
          for (const fileUrl of result.fileLinks) {
            if (!this.visitedUrls.has(fileUrl)) {
              this.visitedUrls.add(fileUrl)
              const fileResult = await this.crawlFile(fileUrl, query, node)
              if (fileResult) {
                this.results.push(fileResult)
                pagesProcessed++
              }
            }
          }

          // Adaptive depth: go deeper if finding valuable data
          if (options.adaptiveDepth && result.dataPoints.length > 0) {
            const adaptedDepth = this.calculateAdaptiveDepth(result, options)
            if (adaptedDepth > node.depth) {
              // Allow deeper crawling for this branch
              await this.queueLinksAdaptively(result, node, adaptedDepth, query, options)
            }
          } else if (options.followLinks && node.depth < options.maxDepth) {
            // Standard link following
            await this.queueLinks(result, node, query, options)
          }
        }
      } catch (error) {
        console.error(`Error crawling ${node.url}:`, error)
      }

      // Mark node as explored
      node.explored = true
    }

    // Post-process results to enhance data extraction
    return this.postProcessResults(this.results, query)
  }

  private async crawlPage(
    node: CrawlNode,
    query: string,
    domain: string,
    options: CrawlOptions
  ): Promise<CrawlResult | null> {
    try {
      const response = await this.firecrawl!.scrapeUrl(node.url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        includeTags: ['table', 'figure', 'data', 'stats'],
        waitFor: 2000 // Wait for dynamic content
      })

      if (!response.success) {
        return null
      }

      const data = response as any
      const content = data.markdown || data.content || ''
      const html = data.html || ''

      // Extract data points
      const dataPoints = this.extractDataPoints(content, html, query, options.dataPatterns)
      
      // Calculate relevance
      const relevanceScore = this.calculateRelevance(content, query, dataPoints)

      // Extract links for potential crawling
      let { webLinks, fileLinks } = this.extractLinks(html, node.url, domain)

      // Discover unlinked, mentioned reports and add them to fileLinks
      if (this.openai) {
        const externalReportUrls = await this.extractAndSearchForMentionedReports(content, query)
        fileLinks.push(...externalReportUrls)
        fileLinks = [...new Set(fileLinks)] // Deduplicate
      }

      return {
        url: node.url,
        title: data.title || node.url,
        content,
        depth: node.depth,
        dataPoints,
        links: webLinks, // Now only web links
        fileLinks, // Extracted file links
        relevanceScore,
        metadata: {
          contentLength: content.length,
          hasStructuredData: dataPoints.length > 0,
          sourceType: this.detectSourceType(html),
          parent: node.parent
        }
      }
    } catch (error) {
      console.error(`Failed to crawl ${node.url}:`, error)
      return null
    }
  }

  private async crawlFile(url: string, query: string, parentNode: CrawlNode): Promise<CrawlResult | null> {
    try {
      if (url.endsWith('.pdf')) {
        const pdf = (await import('pdf-parse')).default
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const data = await pdf(response.data)
        const content = data.text

        const dataPoints = this.extractDataPoints(content, '', query)
        const relevanceScore = this.calculateRelevance(content, query, dataPoints)

        return {
          url,
          title: url.split('/').pop() || url,
          content,
          depth: parentNode.depth + 1,
          dataPoints,
          links: [],
          fileLinks: [],
          relevanceScore,
          metadata: {
            contentType: 'pdf',
            parent: parentNode.url
          }
        }
      }
      // Add logic for other file types (e.g., .xlsx) here in the future
      return null
    } catch (error) {
      console.error(`Failed to crawl file ${url}:`, error)
      return null
    }
  }

  private async extractAndSearchForMentionedReports(
    content: string,
    query: string
  ): Promise<string[]> {
    if (!this.openai || !this.firecrawl) return []

    const prompt = `
        Based on the following text content from a webpage related to the query "${query}", please identify any specific research reports, studies, or datasets that are mentioned by name but are not directly linked.

        For each mentioned report, extract the following if available:
        - Full name of the report
        - Publishing organization or author
        - Year of publication

        Format your response as a JSON object with a key "reports", which is an array of objects, each with keys "name", "publisher", and "year".
        If no reports are mentioned, return an empty array.

        Content to analyze (first 8000 characters):
        ---
        ${content.substring(0, 8000)}
    `

    try {
      const response = await generateObject({
        model: this.openai('gpt-4o-mini'),
        schema: MentionedReportsSchema,
        prompt: prompt,
      })
  
      const mentionedReports = response.object.reports
      if (mentionedReports.length === 0) return []
      
      const foundUrls: string[] = []
  
      for (const report of mentionedReports) {
        const searchQuery = `"${report.name}" ${report.publisher || ''} ${report.year || ''} filetype:pdf`
        console.log(`[External Report Discovery] Searching for: ${searchQuery}`)
        
        const searchResults = await this.firecrawl.search(searchQuery, {
          limit: 1,
          pageOptions: { fetchPageContent: false }
        })
  
        if (searchResults.data && searchResults.data.length > 0) {
          const url = searchResults.data[0].url
          if (url && typeof url === 'string' && url.endsWith('.pdf')) {
               console.log(`[External Report Discovery] Found PDF: ${url}`)
               foundUrls.push(url)
          }
        }
      }
      return foundUrls
    } catch (error) {
      console.error('[External Report Discovery] Failed to process AI response:', error)
      return []
    }
  }

  private extractDataPoints(
    content: string,
    html: string,
    query: string,
    patterns?: RegExp[]
  ): DataPoint[] {
    const dataPoints: DataPoint[] = []

    // 1. Pattern-based extraction
    if (patterns) {
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern)
        for (const match of matches) {
          dataPoints.push({
            value: match[0],
            type: this.classifyDataType(match[0]),
            context: this.extractContext(content, match.index || 0),
            source: 'pattern-match',
            confidence: 0.8
          })
        }
      }
    }

    // 2. Table data extraction
    const tableData = this.extractTableData(html)
    for (const data of tableData) {
      dataPoints.push({
        value: data.value,
        type: data.type,
        context: data.context,
        source: 'table',
        confidence: 0.9
      })
    }

    // 3. Structured data extraction (JSON-LD, microdata)
    const structuredData = this.extractStructuredData(html)
    for (const data of structuredData) {
      dataPoints.push({
        value: data.value,
        type: data.type,
        context: data.context,
        source: 'structured-data',
        confidence: 0.95
      })
    }

    // 4. Smart number extraction with context
    const numbers = this.extractNumbersWithContext(content, query)
    for (const num of numbers) {
      if (!dataPoints.some(dp => dp.value === num.value)) {
        dataPoints.push(num)
      }
    }

    return dataPoints
  }

  private extractTableData(html: string): DataPoint[] {
    const dataPoints: DataPoint[] = []
    
    // Simple table extraction (would use cheerio or similar in production)
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
    const tables = html.matchAll(tableRegex)
    
    for (const table of tables) {
      const rows = table[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []
      
      for (const row of rows) {
        const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []
        
        for (let i = 0; i < cells.length - 1; i++) {
          const label = this.stripHtml(cells[i])
          const value = this.stripHtml(cells[i + 1])
          
          if (this.isDataValue(value)) {
            dataPoints.push({
              value,
              type: this.classifyDataType(value),
              context: `${label}: ${value}`,
              source: 'table',
              confidence: 0.9
            })
          }
        }
      }
    }
    
    return dataPoints
  }

  private extractStructuredData(html: string): DataPoint[] {
    const dataPoints: DataPoint[] = []
    
    // Extract JSON-LD
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    const jsonLdMatches = html.matchAll(jsonLdRegex)
    
    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1])
        this.extractDataFromObject(data, '', dataPoints)
      } catch (e) {
        // Invalid JSON, skip
      }
    }
    
    return dataPoints
  }

  private extractDataFromObject(
    obj: any, 
    path: string, 
    dataPoints: DataPoint[]
  ): void {
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key
        
        if (typeof value === 'string' || typeof value === 'number') {
          if (this.isDataValue(String(value))) {
            dataPoints.push({
              value: String(value),
              type: this.classifyDataType(String(value)),
              context: `${newPath}: ${value}`,
              source: 'structured-data',
              confidence: 0.95
            })
          }
        } else if (typeof value === 'object') {
          this.extractDataFromObject(value, newPath, dataPoints)
        }
      }
    }
  }

  private extractNumbersWithContext(content: string, query: string): DataPoint[] {
    const dataPoints: DataPoint[] = []
    
    // Enhanced number patterns
    const patterns = [
      /(\$?[\d,]+\.?\d*)\s*(billion|million|trillion|thousand|k|m|b)/gi,
      /(\d+\.?\d*)\s*%/g,
      /\$\s*[\d,]+\.?\d*/g,
      /(?:^|[^\d])(\d{4})(?:[^\d]|$)/g, // Years
      /(\d+(?:,\d{3})*(?:\.\d+)?)/g // General numbers
    ]
    
    for (const pattern of patterns) {
      const matches = content.matchAll(pattern)
      
      for (const match of matches) {
        const value = match[0].trim()
        const context = this.extractContext(content, match.index || 0, 100)
        
        // Check if context is relevant to query
        if (this.isRelevantContext(context, query)) {
          dataPoints.push({
            value,
            type: this.classifyDataType(value),
            context,
            source: 'content',
            confidence: 0.7
          })
        }
      }
    }
    
    return dataPoints
  }

  private calculateRelevance(
    content: string,
    query: string,
    dataPoints: DataPoint[]
  ): number {
    let score = 0
    const lowerContent = content.toLowerCase()
    const queryTerms = query.toLowerCase().split(/\s+/)
    
    // Term frequency
    for (const term of queryTerms) {
      const frequency = (lowerContent.match(new RegExp(term, 'g')) || []).length
      score += Math.min(frequency * 0.1, 1)
    }
    
    // Data point bonus
    score += dataPoints.length * 0.2
    
    // High-value data indicators
    if (dataPoints.some(dp => dp.confidence > 0.8)) {
      score += 0.5
    }
    
    return Math.min(score, 1)
  }

  private extractLinks(html: string, baseUrl: string, domain: string): { webLinks: string[], fileLinks: string[] } {
    const webLinks: string[] = []
    const fileLinks: string[] = []
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>/gi
    const matches = html.matchAll(linkRegex)
    const fileExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.docx']
    
    for (const match of matches) {
      try {
        const url = new URL(match[1], baseUrl).href
        
        if (url.includes(domain) && !url.includes('#')) {
          if (fileExtensions.some(ext => url.endsWith(ext))) {
            fileLinks.push(url)
          } else {
            webLinks.push(url)
          }
        }
      } catch (e) {
        // Invalid URL, skip
      }
    }
    
    return { 
      webLinks: [...new Set(webLinks)],
      fileLinks: [...new Set(fileLinks)]
    }
  }

  private async queueLinks(
    result: CrawlResult,
    parent: CrawlNode,
    query: string,
    options: CrawlOptions
  ): Promise<void> {
    const relevantLinks = result.links
      .filter(link => !this.visitedUrls.has(link))
      .slice(0, 10) // Limit links per page
    
    for (const link of relevantLinks) {
      this.crawlQueue.push({
        url: link,
        depth: parent.depth + 1,
        parent: parent.url,
        relevanceScore: result.relevanceScore * 0.8, // Decay relevance
        contentType: 'webpage',
        explored: false
      })
    }
  }

  private async queueLinksAdaptively(
    result: CrawlResult,
    parent: CrawlNode,
    maxDepth: number,
    query: string,
    options: CrawlOptions
  ): Promise<void> {
    // Prioritize links that might contain more data
    const scoredLinks = result.links
      .filter(link => !this.visitedUrls.has(link))
      .map(link => ({
        url: link,
        score: this.scoreLinkRelevance(link, query, result.dataPoints)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // More links for adaptive crawling
    
    for (const { url, score } of scoredLinks) {
      if (score > (options.relevanceThreshold || 0.3)) {
        this.crawlQueue.push({
          url,
          depth: parent.depth + 1,
          parent: parent.url,
          relevanceScore: score,
          contentType: 'webpage',
          explored: false
        })
      }
    }
  }

  private calculateAdaptiveDepth(result: CrawlResult, options: CrawlOptions): number {
    const baseDepth = options.maxDepth
    
    // Increase depth based on data quality
    let depthBonus = 0
    
    if (result.dataPoints.length > 5) depthBonus += 1
    if (result.dataPoints.some(dp => dp.confidence > 0.9)) depthBonus += 1
    if (result.relevanceScore > 0.8) depthBonus += 1
    
    return Math.min(baseDepth + depthBonus, baseDepth * 2)
  }

  private scoreLinkRelevance(url: string, query: string, parentDataPoints: DataPoint[]): number {
    let score = 0.5 // Base score
    
    const urlLower = url.toLowerCase()
    const queryTerms = query.toLowerCase().split(/\s+/)
    
    // URL contains query terms
    for (const term of queryTerms) {
      if (urlLower.includes(term)) score += 0.1
    }
    
    // URL suggests data content
    const dataIndicators = ['data', 'stats', 'report', 'analysis', 'research', 'download']
    for (const indicator of dataIndicators) {
      if (urlLower.includes(indicator)) score += 0.1
    }
    
    // Parent page had good data
    if (parentDataPoints.length > 0) score += 0.2
    
    return Math.min(score, 1)
  }

  private getNextNode(): CrawlNode | null {
    // Prioritize by relevance and shallow depth
    const unexplored = this.crawlQueue.filter(n => !n.explored)
    
    if (unexplored.length === 0) return null
    
    return unexplored.sort((a, b) => {
      // Prefer higher relevance
      const relevanceDiff = b.relevanceScore - a.relevanceScore
      if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff
      
      // Then prefer shallower depth
      return a.depth - b.depth
    })[0]
  }

  private postProcessResults(results: CrawlResult[], query: string): CrawlResult[] {
    // Enhance and deduplicate data points across all results
    const allDataPoints = new Map<string, DataPoint>()
    
    for (const result of results) {
      for (const dp of result.dataPoints) {
        const key = `${dp.value}-${dp.type}`
        const existing = allDataPoints.get(key)
        
        if (!existing || dp.confidence > existing.confidence) {
          allDataPoints.set(key, dp)
        }
      }
    }
    
    // Re-rank results based on unique data contribution
    return results
      .map(result => ({
        ...result,
        dataPoints: result.dataPoints.filter(dp => {
          const key = `${dp.value}-${dp.type}`
          return allDataPoints.get(key) === dp
        })
      }))
      .sort((a, b) => {
        // Sort by data points found and relevance
        const dataScore = b.dataPoints.length - a.dataPoints.length
        if (dataScore !== 0) return dataScore
        
        return b.relevanceScore - a.relevanceScore
      })
  }

  // Helper methods
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim()
  }

  private isDataValue(value: string): boolean {
    // Check if string contains meaningful data
    return /[\d$%]/.test(value) && value.length > 0 && value.length < 100
  }

  private classifyDataType(value: string): DataPoint['type'] {
    if (value.includes('%')) return 'percentage'
    if (value.includes('$') || /\d+\.?\d*\s*(billion|million|trillion)/i.test(value)) return 'currency'
    if (/\d{4}/.test(value) && parseInt(value.match(/\d{4}/)?.[0] || '0') > 1900) return 'date'
    if (/^\d+\.?\d*$/.test(value.replace(/[,\s]/g, ''))) return 'statistic'
    return 'reference'
  }

  private extractContext(content: string, index: number, window: number = 50): string {
    const start = Math.max(0, index - window)
    const end = Math.min(content.length, index + window)
    return content.substring(start, end).trim()
  }

  private isRelevantContext(context: string, query: string): boolean {
    const contextLower = context.toLowerCase()
    const queryTerms = query.toLowerCase().split(/\s+/)
    
    return queryTerms.some(term => contextLower.includes(term))
  }

  private detectSourceType(html: string): string {
    if (html.includes('application/pdf')) return 'pdf-viewer'
    if (/<table/i.test(html)) return 'data-table'
    if (/<(chart|graph|visualization)/i.test(html)) return 'visualization'
    return 'article'
  }
}

// Export singleton instance
export const intelligentCrawler = new IntelligentCrawler() 