import { ApprovedSource } from '../app/types'
import { performMultiStrategySearch, SearchResult as StrategySearchResult, SearchOptions, DataPoint } from './search-strategies'
import { sourceDiscovery } from './ai-source-discovery'
import { intelligentCrawler, CrawlOptions } from './intelligent-crawler'
import { qualityScorer, ScoredResult } from './quality-scoring'
import FirecrawlApp from '@mendable/firecrawl-js'


export interface DeepSearchResult {
  url: string
  title: string
  content: string
  contentType: 'webpage' | 'file' | 'spreadsheet' | 'database'
  fileType?: string
  relevanceScore: number
  dataPoints: string[]
  source: ApprovedSource
  qualityMetrics?: {
    authorityScore: number
    freshnessScore: number
    completenessScore: number
    accuracyScore: number
    relevanceScore: number
    overallScore: number
    confidence: number
    explanation: string
  }
  verificationStatus?: 'verified' | 'partial' | 'unverified'
  crossReferences?: string[]
  strategy?: string
}

export interface DeepSearchOptions {
  maxDepth: number
  includeFiles: boolean
  includeSpreadsheets: boolean
  includeDatabases: boolean
  targetDataPoints: string[]
  useMultiStrategy?: boolean
  useAIDiscovery?: boolean
  useIntelligentCrawling?: boolean
  useQualityScoring?: boolean
  sector?: string // Added for AI discovery
}

// Enhanced deep search with new capabilities
export async function performDeepSearch(
  query: string,
  options: DeepSearchOptions,
  firecrawlApiKey: string,
  progressCallback?: (progress: { completed: number; total: number; stage?: string, source?: ApprovedSource }) => void
): Promise<DeepSearchResult[]> {
  
  const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

  // Stage 1: Broad Web Search
  if (progressCallback) {
    progressCallback({ completed: 0, total: 1, stage: 'Conducting broad web search...' })
  }

  const searchResults = await firecrawl.search(query, {
    limit: 40, // Increased to get more initial results to filter
    scrapeOptions: {
      formats: ['markdown'],
      onlyMainContent: true
    }
  })

  let allResults: StrategySearchResult[] = searchResults.data?.map((item: any) => ({
    url: item.url,
    title: item.title || item.url,
    content: item.markdown || item.content || '',
    summary: (item.markdown || item.content || '').substring(0, 300), // Add summary
    confidence: item.score || 0.5, // Use firecrawl score as initial confidence
    dataPoints: [], // Will be populated later if needed
    strategy: 'Broad Web Search',
    metadata: item.metadata || {} // Add metadata
  })) || []

  if (progressCallback) {
    progressCallback({ completed: 1, total: 1, stage: 'Initial search complete. Scoring results...' })
  }

  // Stage 2: Quality scoring and ranking
  let scoredResults: ScoredResult[] = []
  
  if (options.useQualityScoring !== false && allResults.length > 0) {
    if (progressCallback) {
      progressCallback({ 
        completed: 0, 
        total: allResults.length, 
        stage: 'Scoring and verifying results...' 
      })
    }

    try {
      scoredResults = await qualityScorer.scoreResults(
        allResults,
        query,
        options.sector
      )
    } catch (error) {
      console.error('Quality scoring failed:', error)
      // Fallback to unscored results
      scoredResults = allResults.map(r => ({
        ...r,
        qualityMetrics: {
          authorityScore: 0.5,
          freshnessScore: 0.5,
          completenessScore: 0.5,
          accuracyScore: 0.5,
          relevanceScore: r.confidence,
          overallScore: r.confidence,
          confidence: r.confidence,
          explanation: 'Quality scoring unavailable'
        },
        verificationStatus: 'unverified' as const,
        crossReferences: []
      }))
    }
  }

  // Stage 3: Intelligent Crawling on promising results
  if (options.useIntelligentCrawling !== false && scoredResults.length > 0) {
    const topResultsToCrawl = scoredResults.slice(0, 5) // Crawl top 5 results

    if (progressCallback) {
      progressCallback({
        completed: 0,
        total: topResultsToCrawl.length,
        stage: `Performing deep dive on ${topResultsToCrawl.length} promising sources...`
      })
    }

    const crawlOptions: CrawlOptions = {
      maxDepth: 2, // Limit depth to avoid excessive crawling
      maxPages: 10,
      followLinks: true,
      adaptiveDepth: true,
      firecrawlApiKey: firecrawlApiKey,
      openaiApiKey: process.env.OPENAI_API_KEY // Pass OpenAI key for report discovery
    }

    let crawlCount = 0
    for (const resultToCrawl of topResultsToCrawl) {
      try {
        const domain = new URL(resultToCrawl.url).hostname
        const crawlResults = await intelligentCrawler.crawl(
          resultToCrawl.url,
          query,
          domain,
          crawlOptions
        )

        // Convert crawl results to StrategySearchResult format and add to results
        const newCrawlResults = crawlResults.map(cr => ({
          url: cr.url,
          title: cr.title,
          content: cr.content,
          summary: cr.content.substring(0, 300),
          confidence: cr.relevanceScore,
          dataPoints: cr.dataPoints,
          strategy: `Deep-Dive (${cr.metadata.contentType || 'webpage'})`,
          metadata: cr.metadata
        }))

        allResults.push(...newCrawlResults)

      } catch (error) {
        console.error(`Crawling failed for ${resultToCrawl.url}:`, error)
      } finally {
        crawlCount++
        if (progressCallback) {
          progressCallback({
            completed: crawlCount,
            total: topResultsToCrawl.length,
            stage: `Deep dive complete for ${crawlCount}/${topResultsToCrawl.length} sources.`
          })
        }
      }
    }

    // Re-score all results including the new ones from the crawl
    if (progressCallback) {
      progressCallback({ completed: 0, total: 1, stage: 'Re-scoring all results...' })
    }
    scoredResults = await qualityScorer.scoreResults(
      allResults,
      query,
      options.sector
    )
  }
  
  // Convert to DeepSearchResult format
  const finalResults: DeepSearchResult[] = scoredResults.map(result => {
    // Create a mock source for display, since we don't have pre-approved sources anymore
    const source: ApprovedSource = {
      domain: new URL(result.url).hostname.replace('www.', ''),
      name: new URL(result.url).hostname,
      description: 'Discovered Web Source',
      contentTypes: ['articles'],
      searchCapabilities: ['web'],
      priority: 5,
      categories: options.sector ? [options.sector] : []
    }

    return {
      url: result.url,
      title: result.title,
      content: result.content,
      contentType: inferContentType(result),
      fileType: result.metadata?.fileType,
      relevanceScore: result.qualityMetrics?.overallScore || result.confidence,
      dataPoints: extractDataPointsAsStrings(result.dataPoints),
      source,
      qualityMetrics: result.qualityMetrics,
      verificationStatus: result.verificationStatus,
      crossReferences: result.crossReferences,
      strategy: result.strategy,
    }
  })

  // Sort by quality score and return the top results
  return finalResults
    .sort((a, b) => 
      (b.qualityMetrics?.overallScore || b.relevanceScore) - 
      (a.qualityMetrics?.overallScore || a.relevanceScore)
    )
    .slice(0, 10) // Return top 10 results
}

// Helper function to infer content type from result
function inferContentType(result: ScoredResult): DeepSearchResult['contentType'] {
  if (result.metadata?.contentType) {
    return result.metadata.contentType as DeepSearchResult['contentType']
  }
  
  if (result.url.includes('.pdf')) return 'file'
  if (result.url.includes('.xls') || result.url.includes('.csv')) return 'spreadsheet'
  if (result.metadata?.sourceType === 'database') return 'database'
  
  return 'webpage'
}

// Helper function to extract data points as strings
function extractDataPointsAsStrings(dataPoints: DataPoint[]): string[] {
  return dataPoints.map(dp => {
    if (typeof dp.value === 'string') return dp.value
    return `${dp.value} (${dp.type})`
  })
} 