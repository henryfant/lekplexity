'use client'

import { useChat } from 'ai/react'
import { SearchComponent } from './search'
import { ChatInterface } from './chat-interface'
import { SearchResult, FollowUpSuggestion } from './types'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/ui/header'
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ErrorDisplay } from '@/components/error-display'
import { LekplexityHero } from '../components/lekplexity-hero'

interface MessageData {
  sources: SearchResult[]
  followUpSuggestions?: FollowUpSuggestion
  ticker?: string
}

export default function DeepSearchPage() {
  const [sources, setSources] = useState<SearchResult[]>([])
  const [followUpSuggestions, setFollowUpSuggestions] = useState<FollowUpSuggestion | null>(null)
  const [searchStatus, setSearchStatus] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const lastDataLength = useRef(0)
  const [messageData, setMessageData] = useState<Map<number, MessageData>>(new Map())
  const currentMessageIndex = useRef(0)
  const [currentTicker, setCurrentTicker] = useState<string | null>(null)
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>('')
  const [hasApiKey, setHasApiKey] = useState<boolean>(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false)
  const [, setIsCheckingEnv] = useState<boolean>(true)
  const [pendingQuery, setPendingQuery] = useState<string>('')
  const [excludedDomains, setExcludedDomains] = useState<string[]>([])
  const [sector, setSector] = useState<string>('Industrials')

  const { messages, input, handleInputChange, handleSubmit, isLoading, data } = useChat({
    api: '/api/fireplexity/deep-search',
    body: {
      ...(firecrawlApiKey && { firecrawlApiKey }),
      ...(excludedDomains.length > 0 && { 
        isFollowUpSearch: true,
        excludedDomains 
      }),
      sector
    },
    onResponse: () => {
      // Clear status when response starts
      setSearchStatus('')
      // Clear current data for new response
      setSources([])
      setFollowUpSuggestions(null)
      setCurrentTicker(null)
      // Track the current message index (assistant messages only)
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      currentMessageIndex.current = assistantMessages.length
    },
    onError: (error) => {
      console.error('Chat error:', error)
      setSearchStatus('')
    },
    onFinish: () => {
      setSearchStatus('')
      // Reset data length tracker
      lastDataLength.current = 0
    }
  })

  // Handle streaming data
  useEffect(() => {
    if (data && data.length > lastDataLength.current) {
      const newData = data.slice(lastDataLength.current)
      lastDataLength.current = data.length

      newData.forEach((chunk: any) => {
        if (chunk.type === 'status') {
          setSearchStatus(chunk.message)
        } else if (chunk.type === 'sources') {
          setSources(chunk.sources)

          // Store these sources for the current assistant response so that citations continue to work
          const newMap = new Map(messageData)
          const existingData = newMap.get(currentMessageIndex.current) || { sources: [] }
          newMap.set(currentMessageIndex.current, { ...existingData, sources: chunk.sources })
          setMessageData(newMap)
        } else if (chunk.type === 'ticker') {
          setCurrentTicker(chunk.symbol)
        } else if (chunk.type === 'follow_up_suggestions') {
          setFollowUpSuggestions({
            suggestion: chunk.suggestions,
            remainingSources: chunk.remainingSources
          })
        }
      })
    }
  }, [data])

  // Check for API key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('firecrawl-api-key')
    if (storedKey) {
      setFirecrawlApiKey(storedKey)
      setHasApiKey(true)
    }
    setIsCheckingEnv(false)
  }, [])

  const handleApiKeySubmit = () => {
    if (firecrawlApiKey.trim()) {
      localStorage.setItem('firecrawl-api-key', firecrawlApiKey)
      setHasApiKey(true)
      setShowApiKeyModal(false)
      toast.success('API key saved successfully!')
      
      // If there's a pending query, submit it
      if (pendingQuery) {
        const fakeEvent = {
          preventDefault: () => {},
          currentTarget: {
            querySelector: () => ({ value: pendingQuery })
          }
        } as any
        handleInputChange({ target: { value: pendingQuery } } as any)
        setTimeout(() => {
          handleSubmit(fakeEvent)
          setPendingQuery('')
        }, 100)
      }
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Check if we have an API key
    if (!hasApiKey) {
      setPendingQuery(input)
      setShowApiKeyModal(true)
      return
    }
    
    setHasSearched(true)
    // Clear current data immediately when submitting new query
    setSources([])
    setFollowUpSuggestions(null)
    setCurrentTicker(null)
    setExcludedDomains([]) // Reset excluded domains for new search
    handleSubmit(e)
  }
  
  // Wrapped submit handler for chat interface
  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Check if we have an API key
    if (!hasApiKey) {
      setPendingQuery(input)
      setShowApiKeyModal(true)
      e.preventDefault()
      return
    }
    
    // Store current data in messageData before clearing
    if (messages.length > 0 && sources.length > 0) {
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      const lastAssistantIndex = assistantMessages.length - 1
      if (lastAssistantIndex >= 0) {
        const newMap = new Map(messageData)
        newMap.set(lastAssistantIndex, {
          sources: sources,
          followUpSuggestions: followUpSuggestions || undefined,
          ticker: currentTicker || undefined
        })
        setMessageData(newMap)
      }
    }
    
    // Clear current data immediately when submitting new query
    setSources([])
    setFollowUpSuggestions(null)
    setCurrentTicker(null)
    handleSubmit(e)
  }

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSector(e.target.value)
  }

  const isChatActive = hasSearched || messages.length > 0

  const SECTOR_EXAMPLE_SOURCES: Record<string, string> = {
    Industrials: 'census.gov, fred.stlouisfed.org, bls.gov, americanchemistry.com',
    TMT: 'fcc.gov, gartner.com, idc.com, sec.gov',
    Healthcare: 'cms.gov, fda.gov, cdc.gov, iqvia.com',
    Consumer: 'census.gov, bls.gov, nielsen.com, npd.com'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isChatActive ? (
          <div className="text-center">
            <LekplexityHero />
            <div className="mb-8 mt-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Sector Search</h2>
              <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                Conduct a deep search of curated sources for sector-specific data points.
              </p>
            </div>
            <SearchComponent
              handleSubmit={handleSearch}
              input={input}
              handleInputChange={handleInputChange}
              isLoading={isLoading}
              sector={sector}
              onSectorChange={handleSectorChange}
            />
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>
                Powered by L.E.K. grade sources including {SECTOR_EXAMPLE_SOURCES[sector]}
                {SECTOR_EXAMPLE_SOURCES[sector].split(',').length < 4 ? ', and more.' : ', and more.'}
              </p>
            </div>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            sources={sources}
            followUpQuestions={[]} // Not used in deep search
            followUpSuggestions={followUpSuggestions}
            searchStatus={searchStatus}
            isLoading={isLoading}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleChatSubmit}
            messageData={messageData}
            currentTicker={currentTicker}
            isDeepSearch={true}
            excludedDomains={excludedDomains}
            onExcludeDomains={setExcludedDomains}
          />
        )}
      </main>

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Firecrawl API Key</DialogTitle>
            <DialogDescription>
              You need a Firecrawl API key to use the deep search feature. 
              Get your free API key at{' '}
              <a 
                href="https://firecrawl.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-500 underline"
              >
                firecrawl.dev
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="fc-your-api-key"
              value={firecrawlApiKey}
              onChange={(e) => setFirecrawlApiKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApiKeySubmit()}
            />
            <Button onClick={handleApiKeySubmit} className="w-full">
              Save API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 