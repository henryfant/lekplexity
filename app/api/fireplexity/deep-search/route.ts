import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText, createDataStreamResponse } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { getDeepDataSystemPrompt } from '@/lib/ai-config'
import { getApprovedSourcesForQuery, getNextBestSources, getApprovedSourcesForSector } from '@/lib/approved-sources'
import { performDeepSearch, DeepSearchOptions } from '@/lib/deep-search'
import FirecrawlApp from '@mendable/firecrawl-js'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Deep Search API called`)
  
  try {
    const body = await request.json()
    const messages = body.messages || []
    const query = messages[messages.length - 1]?.content || body.query
    console.log(`[${requestId}] Query received:`, query)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Use API key from request body if provided, otherwise fall back to environment variable
    const firecrawlApiKey = body.firecrawlApiKey || process.env.FIRECRAWL_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!firecrawlApiKey) {
      return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 })
    }
    
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Configure OpenAI with API key
    const openai = createOpenAI({
      apiKey: openaiApiKey
    })

    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

    // Get approved sources for this query or sector
    let approvedSources
    if (body.sector) {
      approvedSources = getApprovedSourcesForSector(body.sector)
      console.log(`[${requestId}] Sector selected: ${body.sector}. Sources:`, approvedSources.map(s => s.name))
    } else {
      approvedSources = getApprovedSourcesForQuery(query)
      console.log(`[${requestId}] Selected sources:`, approvedSources.map(s => s.name))
    }

    // Check if this is a follow-up search request
    const isFollowUpSearch = body.isFollowUpSearch || false
    const excludedDomains = body.excludedDomains || []
    
    let sourcesToSearch = approvedSources
    if (isFollowUpSearch && excludedDomains.length > 0) {
      sourcesToSearch = getNextBestSources(excludedDomains)
      console.log(`[${requestId}] Follow-up search with sources:`, sourcesToSearch.map(s => s.name))
    }

    // Use createDataStreamResponse with a custom data stream
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          // Update status
          dataStream.writeData({ 
            type: 'status', 
            message: `Searching ${sourcesToSearch.length} high-quality sources for specific data...` 
          })

          // Configure deep search options
          const searchOptions: DeepSearchOptions = {
            maxDepth: 3,
            includeFiles: true,
            includeSpreadsheets: true,
            includeDatabases: true,
            targetDataPoints: extractTargetDataPoints(query)
          }

          // Perform deep search on approved sources
          const deepSearchResults = await performDeepSearch(
            query,
            sourcesToSearch,
            searchOptions,
            firecrawlApiKey
          )

          // Transform results for the frontend
          const sources = deepSearchResults.map((result, index) => ({
            url: result.url,
            title: result.title,
            description: `${result.source.name} - ${result.contentType}`,
            content: result.content,
            markdown: result.content,
            publishedDate: null,
            author: null,
            image: null,
            favicon: null,
            siteName: result.source.name,
            relevanceScore: result.relevanceScore,
            contentType: result.contentType,
            dataPoints: result.dataPoints
          }))

          // Send sources immediately
          dataStream.writeData({ type: 'sources', sources })
          
          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Update status
          dataStream.writeData({ type: 'status', message: 'Analyzing data and generating precise answer...' })
          
          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          console.log(`[${requestId}] Query: "${query}" -> Detected ticker: ${ticker}`)
          if (ticker) {
            dataStream.writeData({ type: 'ticker', symbol: ticker })
          }
          
          // Prepare context from deep search results
          const context = sources
            .map((source, index) => {
              const content = source.content || ''
              const truncatedContent = content.length > 3000 ? content.slice(0, 3000) + '...' : content
              return `[${index + 1}] ${source.title}\nSource: ${source.siteName}\nType: ${source.contentType}\nRelevance Score: ${source.relevanceScore}\nData Points: ${source.dataPoints?.join(', ') || 'None'}\nURL: ${source.url}\n${truncatedContent}`
            })
            .join('\n\n---\n\n')

          console.log(`[${requestId}] Creating text stream for query:`, query)
          console.log(`[${requestId}] Context length:`, context.length)
          
          // Prepare messages for the AI
          let aiMessages = []
          
          if (!isFollowUpSearch) {
            // Initial query with deep search results
            aiMessages = [
              {
                role: 'system',
                content: getDeepDataSystemPrompt()
              },
              {
                role: 'user',
                content: `Extract the specific data point(s) requested in this query: "${query}"\n\nBased on these deep search results from high-quality sources:\n${context}\n\nIf the specific data is not found in these sources, clearly state this and suggest the next best sources to search.`
              }
            ]
          } else {
            // Follow-up search with new sources
            aiMessages = [
              {
                role: 'system',
                content: getDeepDataSystemPrompt()
              },
              // Include conversation context
              ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content
              })),
              // Add the current query with the new search results
              {
                role: 'user',
                content: `I searched additional sources for the data you requested. Here are the results:\n\n${context}\n\nDid I find the specific data point(s) you were looking for? If not, I can suggest other high-quality sources to search.`
              }
            ]
          }
          
          // Generate follow-up suggestions for next sources to search
          const remainingSources = getNextBestSources(sourcesToSearch.map(s => s.domain))
          const followUpPromise = generateText({
            model: openai('gpt-4o-mini'),
            messages: [
              {
                role: 'system',
                content: `Generate 3-5 specific suggestions for additional high-quality sources that might contain the requested data. Focus on sources that specialize in the type of data being requested.`
              },
              {
                role: 'user',
                content: `Query: ${query}\n\nSearched sources: ${sourcesToSearch.map(s => s.name).join(', ')}\n\nAvailable remaining sources: ${remainingSources.map(s => s.name).join(', ')}\n\nSuggest which additional sources would be most likely to contain the specific data requested.`
              }
            ],
            temperature: 0.7,
            maxTokens: 150,
          })
          
          // Stream the text generation
          const result = streamText({
            model: openai('gpt-4o-mini'),
            messages: aiMessages,
            temperature: 0.3, // Lower temperature for more precise data extraction
            maxTokens: 2000
          })
          
          // Merge the text stream into the data stream
          result.mergeIntoDataStream(dataStream)
          
          // Wait for both the text generation and follow-up suggestions
          const [fullAnswer, followUpResponse] = await Promise.all([
            result.text,
            followUpPromise
          ])
          
          // Process follow-up suggestions
          const followUpSuggestions = followUpResponse.text
            .split('\n')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .slice(0, 5)

          // Send follow-up suggestions after the answer is complete
          dataStream.writeData({ 
            type: 'follow_up_suggestions', 
            suggestions: followUpSuggestions,
            remainingSources: remainingSources.map(s => ({ name: s.name, domain: s.domain, description: s.description }))
          })
          
          // Signal completion
          dataStream.writeData({ type: 'complete' })
          
        } catch (error) {
          console.error('Deep search stream error:', error)
          
          // Handle specific error types
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          const statusCode = error && typeof error === 'object' && 'statusCode' in error 
            ? error.statusCode 
            : error && typeof error === 'object' && 'status' in error
            ? error.status
            : undefined
          
          // Provide user-friendly error messages
          const errorResponses: Record<number, { error: string; suggestion?: string }> = {
            401: {
              error: 'Invalid API key',
              suggestion: 'Please check your Firecrawl API key is correct.'
            },
            402: {
              error: 'Insufficient credits',
              suggestion: 'You\'ve run out of Firecrawl credits. Please upgrade your plan.'
            },
            429: {
              error: 'Rate limit exceeded',
              suggestion: 'Too many requests. Please wait a moment and try again.'
            },
            504: {
              error: 'Request timeout',
              suggestion: 'The deep search took too long. Try a more specific query.'
            }
          }
          
          const errorResponse = statusCode && errorResponses[statusCode as keyof typeof errorResponses] 
            ? errorResponses[statusCode as keyof typeof errorResponses]
            : { error: errorMessage }
          
          const errorData: Record<string, any> = { 
            type: 'error', 
            error: errorResponse.error
          }
          
          if (errorResponse.suggestion) {
            errorData.suggestion = errorResponse.suggestion
          }
          
          if (statusCode) {
            errorData.statusCode = statusCode
          }
          
          dataStream.writeData(errorData)
        }
      },
      headers: {
        'x-vercel-ai-data-stream': 'v1',
      },
    })
    
  } catch (error) {
    console.error('Deep search API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { error: 'Deep search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}

// Helper function to extract target data points from query
function extractTargetDataPoints(query: string): string[] {
  const dataPoints: string[] = []
  const lowerQuery = query.toLowerCase()
  
  // Look for specific data types mentioned
  const dataTypes = [
    'revenue', 'profit', 'earnings', 'sales', 'growth', 'market cap',
    'price', 'value', 'percentage', 'rate', 'ratio', 'index',
    'gdp', 'inflation', 'unemployment', 'interest rate'
  ]
  
  for (const dataType of dataTypes) {
    if (lowerQuery.includes(dataType)) {
      dataPoints.push(dataType)
    }
  }
  
  return dataPoints
} 