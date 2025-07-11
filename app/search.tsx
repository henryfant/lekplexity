'use client'

import { Search, Loader2 } from 'lucide-react'
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pt-12">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="h-14 text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors pr-14 w-full"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            variant="green"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
        {sector && onSectorChange && (
          <select
            value={sector}
            onChange={onSectorChange}
            className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors min-w-[120px]"
            disabled={isLoading}
          >
            <option value="Consumer">Consumer</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Industrials">Industrials</option>
            <option value="TMT">TMT</option>
          </select>
        )}
      </div>
    </form>
  )
}