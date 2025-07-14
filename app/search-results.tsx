'use client'

import { ExternalLink, FileText, Calendar, User, Globe, Sparkles, Building } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SearchResult } from './types'
import Image from 'next/image'
import { CharacterCounter } from './character-counter'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
}

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative">
            {/* Shimmer effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
            <Card className="relative p-5 animate-pulse bg-white dark:bg-zinc-800 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-4/6"></div>
              </div>
              <div className="h-32 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-3xl" />
          </div>
          <FileText className="relative h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        </div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No results found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Try a different search query or check your filters.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result, index) => (
        <a
          key={index}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block opacity-0 animate-fade-up h-full"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'forwards'
          }}
        >
          <Card className="relative h-full p-5 bg-white dark:bg-zinc-800 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="relative">
              {/* Header with favicon and source */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative flex-shrink-0">
                  {result.favicon ? (
                    <Image
                      src={result.favicon}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`${result.favicon ? 'hidden' : ''} w-8 h-8 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center`}>
                    <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {result.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{new URL(result.url).hostname.replace('www.', '')}</span>
                    {result.publishedDate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(result.publishedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: result.publishedDate.includes(new Date().getFullYear().toString()) ? undefined : 'numeric'
                          })}
                        </span>
                      </>
                    )}
                    {result.author && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3" />
                          {result.author}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
              </div>
              
              {/* Description */}
              {result.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                  {result.description}
                </p>
              )}
              
              {/* Screenshot with enhanced hover effect */}
              {result.image && (
                <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-700 group/img">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                  <Image
                    src={result.image}
                    alt=""
                    width={400}
                    height={300}
                    className="w-full h-40 object-cover object-top transition-transform duration-300 group-hover/img:scale-105"
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Metadata footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {result.relevanceScore && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>{Math.round(result.relevanceScore * 100)}% match</span>
                    </div>
                  )}
                  {result.contentType && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="capitalize">{result.contentType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </a>
      ))}
    </div>
  )
}