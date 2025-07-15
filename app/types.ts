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
  qualityMetrics?: {
    authorityScore: number
    freshnessScore: number
    completenessScore: number
    accuracyScore: number
    relevanceScore: number
    overallScore: number
    confidence: number
    explanation: string
  } | null
  verificationStatus?: 'verified' | 'partial' | 'unverified' | null
  crossReferences?: string[]
}

export interface FollowUpSuggestion {
  suggestion: string[]
  remainingSources: Array<{
    name: string
    domain: string
    description: string
  }>
}

export interface ApprovedSource {
  domain: string
  name: string
  description: string
  contentTypes: ('articles' | 'reports' | 'spreadsheets' | 'datasets' | 'documents')[]
  searchCapabilities: ('web' | 'files' | 'spreadsheets' | 'databases')[]
  priority: number // 1-10, higher = more important
  categories: string[] // e.g., ['financial', 'market-data', 'research']
  apiEndpoint?: string // If the source has a specific API
  fileExtensions?: string[] // Supported file types for deep search
}