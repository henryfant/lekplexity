'use client'

import { Search, Loader2, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchComponentProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
  sector?: string
  onSectorChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function SearchComponent({ handleSubmit, input, handleInputChange, isLoading, sector, onSectorChange }: SearchComponentProps) {
  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pt-12">
      <div className="relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 blur-3xl opacity-70 -z-10" />
        
        <div className="flex flex-col gap-4">
          {/* Search input container */}
          <div className="relative group">
            {/* Animated border gradient */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
            
            <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 rounded-2xl p-2 shadow-xl">
              {/* Search icon with animation */}
              <div className="pl-4 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              
              <Input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={sector ? `Search ${sector} sector insights...` : "Ask anything..."}
                className="flex-1 h-14 text-lg border-0 bg-transparent focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 pr-2 text-gray-500 dark:text-gray-300"
                disabled={isLoading}
              />
              
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Sector selector for deep search */}
          {sector && onSectorChange && (
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg opacity-0 group-hover:opacity-50 blur transition duration-300" />
                <select
                  value={sector}
                  onChange={onSectorChange}
                  className="relative h-12 px-6 rounded-lg border-0 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-base font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 cursor-pointer appearance-none pr-10"
                  disabled={isLoading}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="Consumer">Consumer</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Industrials">Industrials</option>
                  <option value="TMT">TMT</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Animated suggestions */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 opacity-0 animate-fade-in" style={{ animationDelay: '500ms' }}>
          {!sector && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Try:</span>
              {['Latest AI developments', 'Stock market trends', 'Climate change solutions'].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                  className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </>
          )}
          {sector && (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Popular {sector} queries:</span>
              {getSectorSuggestions(sector).map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                  className="text-sm px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all duration-200 hover:scale-105"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </form>
  )
}

function getSectorSuggestions(sector: string): string[] {
  const suggestions: Record<string, string[]> = {
    Consumer: ['Market share trends', 'Consumer spending patterns', 'E-commerce growth'],
    Healthcare: ['FDA approvals', 'Clinical trial results', 'Healthcare spending'],
    Industrials: ['Supply chain analysis', 'Manufacturing trends', 'Infrastructure investments'],
    TMT: ['Tech earnings', 'AI market size', 'Telecom growth']
  }
  return suggestions[sector] || []
}