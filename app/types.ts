export interface SearchResult {
  url: string
  title: string
  description?: string
  content?: string
  publishedDate?: string
  author?: string
  markdown?: string
  image?: string
  favicon?: string
  siteName?: string
  relevanceScore?: number
  contentType?: 'webpage' | 'file' | 'spreadsheet' | 'database'
  dataPoints?: string[]
}

export interface FollowUpSuggestion {
  suggestion: string[]
  remainingSources: Array<{
    name: string
    domain: string
    description: string
  }>
}