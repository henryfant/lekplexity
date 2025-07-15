'use client'

import { ExternalLink, FileText, Calendar, User, Globe, Sparkles, Building, Shield, ShieldCheck, ShieldAlert, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
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

  const getVerificationIcon = (status: string | null | undefined) => {
    switch (status) {
      case 'verified':
        return <ShieldCheck className="h-4 w-4 text-green-500" />
      case 'partial':
        return <Shield className="h-4 w-4 text-yellow-500" />
      default:
        return <ShieldAlert className="h-4 w-4 text-gray-400" />
    }
  }

  const getVerificationText = (status: string | null | undefined) => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'partial':
        return 'Partially Verified'
      default:
        return 'Unverified'
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500'
    if (score >= 0.6) return 'text-yellow-500'
    return 'text-gray-400'
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
            
            {/* Verification Badge */}
            {result.verificationStatus && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs">
                {getVerificationIcon(result.verificationStatus)}
                <span>{getVerificationText(result.verificationStatus)}</span>
              </div>
            )}
            
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

              {/* Quality Metrics */}
              {result.qualityMetrics && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Shield className={`h-3 w-3 ${getQualityColor(result.qualityMetrics.authorityScore)}`} />
                      <span className="text-gray-600 dark:text-gray-400">Authority: {Math.round(result.qualityMetrics.authorityScore * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={`h-3 w-3 ${getQualityColor(result.qualityMetrics.freshnessScore)}`} />
                      <span className="text-gray-600 dark:text-gray-400">Freshness: {Math.round(result.qualityMetrics.freshnessScore * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className={`h-3 w-3 ${getQualityColor(result.qualityMetrics.accuracyScore)}`} />
                      <span className="text-gray-600 dark:text-gray-400">Accuracy: {Math.round(result.qualityMetrics.accuracyScore * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-3 w-3 ${getQualityColor(result.qualityMetrics.overallScore)}`} />
                      <span className="text-gray-600 dark:text-gray-400">Overall: {Math.round(result.qualityMetrics.overallScore * 100)}%</span>
                    </div>
                  </div>
                  {result.qualityMetrics.explanation && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      {result.qualityMetrics.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Data Points */}
              {result.dataPoints && result.dataPoints.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Sparkles className="h-3 w-3 text-green-500" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Key Data Points</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.dataPoints.slice(0, 3).map((point, idx) => (
                      <span key={idx} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        {point}
                      </span>
                    ))}
                    {result.dataPoints.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                        +{result.dataPoints.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
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

              {/* Cross References */}
              {result.crossReferences && result.crossReferences.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertCircle className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Cross-referenced in {result.crossReferences.length} source{result.crossReferences.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
              
              {/* Metadata footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {result.relevanceScore && !result.qualityMetrics && (
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