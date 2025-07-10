import { ApprovedSource, getSourceMetadata } from './approved-sources'

export interface DeepSearchResult {
  url: string
  title: string
  content: string
  contentType: 'webpage' | 'file' | 'spreadsheet' | 'database'
  fileType?: string
  relevanceScore: number
  dataPoints: string[]
  source: ApprovedSource
}

export interface DeepSearchOptions {
  maxDepth: number
  includeFiles: boolean
  includeSpreadsheets: boolean
  includeDatabases: boolean
  targetDataPoints: string[]
}

// Perform deep search on approved sources
export async function performDeepSearch(
  query: string,
  sources: ApprovedSource[],
  options: DeepSearchOptions,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  const results: DeepSearchResult[] = []
  
  // Search top 2-3 most relevant sources first
  const topSources = sources.slice(0, 3)
  
  for (const source of topSources) {
    try {
      const sourceResults = await searchSingleSource(query, source, options, firecrawlApiKey)
      results.push(...sourceResults)
    } catch (error) {
      console.error(`Error searching ${source.domain}:`, error)
    }
  }
  
  // Sort by relevance score
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
}

async function searchSingleSource(
  query: string,
  source: ApprovedSource,
  options: DeepSearchOptions,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  const results: DeepSearchResult[] = []
  
  // 1. Search main website content
  const webResults = await searchWebContent(query, source, firecrawlApiKey)
  results.push(...webResults)
  
  // 2. Search files if enabled and supported
  if (options.includeFiles && source.searchCapabilities.includes('files')) {
    const fileResults = await searchFiles(query, source, options, firecrawlApiKey)
    results.push(...fileResults)
  }
  
  // 3. Search spreadsheets if enabled and supported
  if (options.includeSpreadsheets && source.searchCapabilities.includes('spreadsheets')) {
    const spreadsheetResults = await searchSpreadsheets(query, source, options, firecrawlApiKey)
    results.push(...spreadsheetResults)
  }
  
  // 4. Search databases if enabled and supported
  if (options.includeDatabases && source.searchCapabilities.includes('databases')) {
    const databaseResults = await searchDatabases(query, source, options, firecrawlApiKey)
    results.push(...databaseResults)
  }
  
  return results
}

async function searchWebContent(
  query: string,
  source: ApprovedSource,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          maxAge: 6048000
        },
        filters: {
          includeDomains: [source.domain]
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`)
    }

    const searchData = await response.json()
    
    return searchData.data?.map((item: any) => ({
      url: item.url,
      title: item.title || item.url,
      content: item.markdown || item.content || '',
      contentType: 'webpage' as const,
      relevanceScore: calculateRelevanceScore(query, item.markdown || item.content || ''),
      dataPoints: extractDataPoints(query, item.markdown || item.content || ''),
      source
    })) || []
  } catch (error) {
    console.error(`Error searching web content for ${source.domain}:`, error)
    return []
  }
}

async function searchFiles(
  query: string,
  source: ApprovedSource,
  options: DeepSearchOptions,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  const results: DeepSearchResult[] = []
  
  // Search for different file types
  for (const fileExt of source.fileExtensions || []) {
    try {
      const fileQuery = `${query} filetype:${fileExt.replace('.', '')} site:${source.domain}`
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: fileQuery,
          limit: 3,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
            maxAge: 6048000
          },
          filters: {
            includeDomains: [source.domain]
          }
        }),
      })

      if (response.ok) {
        const searchData = await response.json()
        
        const fileResults = searchData.data?.map((item: any) => ({
          url: item.url,
          title: item.title || item.url,
          content: item.markdown || item.content || '',
          contentType: 'file' as const,
          fileType: fileExt,
          relevanceScore: calculateRelevanceScore(query, item.markdown || item.content || ''),
          dataPoints: extractDataPoints(query, item.markdown || item.content || ''),
          source
        })) || []
        
        results.push(...fileResults)
      }
    } catch (error) {
      console.error(`Error searching files for ${source.domain}:`, error)
    }
  }
  
  return results
}

async function searchSpreadsheets(
  query: string,
  source: ApprovedSource,
  options: DeepSearchOptions,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  // Search for spreadsheet files specifically
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv']
  const results: DeepSearchResult[] = []
  
  for (const ext of spreadsheetExtensions) {
    if (source.fileExtensions?.includes(ext)) {
      try {
        const spreadsheetQuery = `${query} filetype:${ext.replace('.', '')} site:${source.domain}`
        
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: spreadsheetQuery,
            limit: 2,
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
              maxAge: 6048000
            },
            filters: {
              includeDomains: [source.domain]
            }
          }),
        })

        if (response.ok) {
          const searchData = await response.json()
          
          const spreadsheetResults = searchData.data?.map((item: any) => ({
            url: item.url,
            title: item.title || item.url,
            content: item.markdown || item.content || '',
            contentType: 'spreadsheet' as const,
            fileType: ext,
            relevanceScore: calculateRelevanceScore(query, item.markdown || item.content || ''),
            dataPoints: extractDataPoints(query, item.markdown || item.content || ''),
            source
          })) || []
          
          results.push(...spreadsheetResults)
        }
      } catch (error) {
        console.error(`Error searching spreadsheets for ${source.domain}:`, error)
      }
    }
  }
  
  return results
}

async function searchDatabases(
  query: string,
  source: ApprovedSource,
  options: DeepSearchOptions,
  firecrawlApiKey: string
): Promise<DeepSearchResult[]> {
  // For databases, we might need to use specific APIs
  // For now, we'll search for database-related content
  try {
    const databaseQuery = `${query} database data API site:${source.domain}`
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: databaseQuery,
        limit: 2,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          maxAge: 6048000
        },
        filters: {
          includeDomains: [source.domain]
        }
      }),
    })

    if (response.ok) {
      const searchData = await response.json()
      
      return searchData.data?.map((item: any) => ({
        url: item.url,
        title: item.title || item.url,
        content: item.markdown || item.content || '',
        contentType: 'database' as const,
        relevanceScore: calculateRelevanceScore(query, item.markdown || item.content || ''),
        dataPoints: extractDataPoints(query, item.markdown || item.content || ''),
        source
      })) || []
    }
  } catch (error) {
    console.error(`Error searching databases for ${source.domain}:`, error)
  }
  
  return []
}

function calculateRelevanceScore(query: string, content: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerContent = content.toLowerCase()
  
  let score = 0
  
  // Exact phrase matches
  const queryWords = lowerQuery.split(/\s+/)
  const exactMatches = queryWords.filter(word => 
    word.length > 3 && lowerContent.includes(word)
  ).length
  score += exactMatches * 10
  
  // Proximity scoring
  const words = lowerContent.split(/\s+/)
  for (let i = 0; i < words.length - 1; i++) {
    const wordPair = `${words[i]} ${words[i + 1]}`
    if (lowerQuery.includes(wordPair)) {
      score += 5
    }
  }
  
  // Data point relevance
  const dataPoints = extractDataPoints(query, content)
  score += dataPoints.length * 15
  
  return score
}

function extractDataPoints(query: string, content: string): string[] {
  const dataPoints: string[] = []
  const lowerContent = content.toLowerCase()
  
  // Look for numbers, percentages, dates, etc.
  const numberPatterns = [
    /\$[\d,]+\.?\d*/g, // Currency
    /[\d,]+\.?\d*%/g, // Percentages
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Dates
    /\d{4}-\d{2}-\d{2}/g, // ISO dates
    /[\d,]+\.?\d*\s*(million|billion|trillion)/gi, // Large numbers
  ]
  
  for (const pattern of numberPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      dataPoints.push(...matches)
    }
  }
  
  // Look for specific data mentioned in query
  const queryWords = query.toLowerCase().split(/\s+/)
  for (const word of queryWords) {
    if (word.length > 4 && lowerContent.includes(word)) {
      // Find the context around this word
      const index = lowerContent.indexOf(word)
      const context = content.substring(Math.max(0, index - 50), index + 50)
      dataPoints.push(context.trim())
    }
  }
  
  return [...new Set(dataPoints)] // Remove duplicates
} 