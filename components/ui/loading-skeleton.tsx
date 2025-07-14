import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'default' | 'pulse' | 'shimmer'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export function LoadingSkeleton({ 
  className,
  variant = 'pulse',
  rounded = 'md'
}: LoadingSkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  const variantClasses = {
    default: 'bg-gray-200 dark:bg-zinc-700',
    pulse: 'bg-gray-200 dark:bg-zinc-700 animate-pulse',
    shimmer: 'bg-gray-200 dark:bg-zinc-700 relative overflow-hidden'
  }

  return (
    <div className={cn(variantClasses[variant], roundedClasses[rounded], className)}>
      {variant === 'shimmer' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
      )}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* User message skeleton */}
      <div className="relative">
        <div className="absolute -left-12 top-1 hidden lg:block">
          <LoadingSkeleton className="w-8 h-8" rounded="full" />
        </div>
        <LoadingSkeleton className="h-8 w-3/4" />
      </div>

      {/* Assistant response skeleton */}
      <div className="relative">
        <div className="absolute -left-12 top-1 hidden lg:block">
          <LoadingSkeleton className="w-8 h-8" rounded="full" variant="shimmer" />
        </div>
        
        <div className="space-y-6">
          {/* Sources skeleton */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LoadingSkeleton className="h-4 w-4" rounded="md" />
              <LoadingSkeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton key={i} className="h-28" rounded="lg" variant="shimmer" />
              ))}
            </div>
          </div>

          {/* Answer skeleton */}
          <div className="bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <LoadingSkeleton className="h-4 w-4" rounded="md" />
              <LoadingSkeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-5/6" />
              <LoadingSkeleton className="h-4 w-4/6" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
          <div className="relative p-5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-start gap-3 mb-4">
              <LoadingSkeleton className="h-8 w-8" rounded="lg" />
              <div className="flex-1">
                <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <LoadingSkeleton className="h-3 w-full" />
              <LoadingSkeleton className="h-3 w-5/6" />
              <LoadingSkeleton className="h-3 w-4/6" />
            </div>
            <LoadingSkeleton className="h-40" rounded="lg" />
          </div>
        </div>
      ))}
    </div>
  )
} 