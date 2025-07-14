import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText, createDataStreamResponse } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { getSystemPrompt, getFollowUpSystemPrompt } from '@/lib/ai-config'
import { selectModel, logModelSelection } from '@/lib/model-router'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Fire Cache Search API called`)
  try {
    const body = await request.json()
    const messages = body.messages || []
    const query = messages[messages.length - 1]?.content || body.query
    console.log(`[${requestId}] Query received:`, query)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    // Extract model preferences from request body
    const modelPreferences = {
      forceModel: body.forceModel,
      preferCostOptimized: body.preferCostOptimized
    }
    
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

    // Get system prompts from configuration
    const systemPrompt = getSystemPrompt()
    const followUpSystemPrompt = getFollowUpSystemPrompt()

    // Always perform a fresh search for each query to ensure relevant results
    const isFollowUp = messages.length > 2
    
    // Use createDataStreamResponse with a custom data stream
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          let sources: Array<{
            url: string
            title: string
            description?: string
            content?: string
            markdown?: string
            publishedDate?: string
            author?: string
            image?: string
            favicon?: string
            siteName?: string
          }> = []
          let context = ''
          
          // Always search for sources to ensure fresh, relevant results
          dataStream.writeData({ type: 'status', message: 'Starting search...' })
          dataStream.writeData({ type: 'status', message: 'Searching for relevant sources...' })
            
            const response = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              limit: 10,
              scrapeOptions: {
                formats: ['markdown'],
                maxAge: 6048000
              }
            }),
          })

          if (!response.ok) {
            throw new Error(`Firecrawl API error: ${response.statusText}`)
          }

          const searchData = await response.json()
          
          // Transform sources metadata
          sources = searchData.data?.map((item: {
            url: string
            title?: string
            description?: string
            content?: string
            markdown?: string
            publishedDate?: string
            author?: string
            metadata?: {
              ogImage?: string
              image?: string
              favicon?: string
              siteName?: string
              description?: string
              [key: string]: unknown
            }
          }) => ({
            url: item.url,
            title: item.title || item.url,
            description: item.description || item.metadata?.description,
            content: item.content,
            markdown: item.markdown,
            publishedDate: item.publishedDate,
            author: item.author,
            image: item.metadata?.ogImage || item.metadata?.image,
            favicon: item.metadata?.favicon,
            siteName: item.metadata?.siteName,
          })) || []

          // Send sources immediately
          dataStream.writeData({ type: 'sources', sources })
          
          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Update status
          dataStream.writeData({ type: 'status', message: 'Analyzing sources and generating answer...' })
          
          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          console.log(`[${requestId}] Query: "${query}" -> Detected ticker: ${ticker}`)
          if (ticker) {
            dataStream.writeData({ type: 'ticker', symbol: ticker })
          }
          
          // Prepare context from sources
          context = sources
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const truncatedContent = content.length > 2000 ? content.slice(0, 2000) + '...' : content
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${truncatedContent}`
            })
            .join('\n\n---\n\n')

          console.log(`[${requestId}] Creating text stream for query:`, query)
          console.log(`[${requestId}] Context length:`, context.length)
          
          // Prepare messages for the AI
          let aiMessages = []
          
          if (!isFollowUp) {
            // Initial query with sources
            aiMessages = [
              {
                role: 'system',
                content: getSystemPrompt(false)
              },
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          } else {
            // Follow-up question - still use fresh sources from the new search
            aiMessages = [
              {
                role: 'system',
                content: getSystemPrompt(true)
              },
              // Include conversation context
              ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
                role: m.role,
                content: m.content
              })),
              // Add the current query with the fresh sources
              {
                role: 'user',
                content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}`
              }
            ]
          }
          
          // Start generating follow-up questions in parallel (before streaming answer)
          const conversationPreview = isFollowUp 
            ? messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n\n')
            : `user: ${query}`
          
          // Select model for follow-up questions generation
          const followUpModel = selectModel('follow_up', query, modelPreferences)
          logModelSelection('follow_up', query, followUpModel)
            
          const followUpPromise = generateText({
            model: openai(followUpModel),
            messages: [
              {
                role: 'system',
                content: getFollowUpSystemPrompt(isFollowUp)
              },
              {
                role: 'user',
                content: `Query: ${query}\n\nConversation context:\n${conversationPreview}\n\n${sources.length > 0 ? `Available sources about: ${sources.map((s: { title: string }) => s.title).join(', ')}\n\n` : ''}Generate 5 diverse follow-up questions that would help the user learn more about this topic from different angles.`
              }
            ],
            temperature: 0.7,
            maxTokens: 150,
          })
          
          // Select model for main synthesis based on query complexity
          const synthesisModel = selectModel('synthesis', query, {
            ...modelPreferences,
            contextLength: context.length
          })
          logModelSelection('synthesis', query, synthesisModel, `Context length: ${context.length}`)
          
          // Stream the text generation
          const result = streamText({
            model: openai(synthesisModel),
            messages: aiMessages,
            temperature: 0.7,
            maxTokens: 2000
          })
          
          // Merge the text stream into the data stream
          // This ensures proper ordering of text chunks
          result.mergeIntoDataStream(dataStream)
          
          // Wait for both the text generation and follow-up questions
          const [fullAnswer, followUpResponse] = await Promise.all([
            result.text,
            followUpPromise
          ])
          
          // Process follow-up questions
          const followUpQuestions = followUpResponse.text
            .split('\n')
            .map((q: string) => q.trim())
            .filter((q: string) => q.length > 0)
            .slice(0, 5)

          // Send follow-up questions after the answer is complete
          dataStream.writeData({ type: 'follow_up_questions', questions: followUpQuestions })
          
          // Signal completion
          dataStream.writeData({ type: 'complete' })
          
        } catch (error) {
          console.error('Stream error:', error)
          dataStream.writeData({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
        }
      },
      headers: {
        'x-vercel-ai-data-stream': 'v1',
      },
    })
    
  } catch (error) {
    console.error('Search API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { error: 'Search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}