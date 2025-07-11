// Pre-approved high-quality sources configuration
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

export const APPROVED_SOURCES: ApprovedSource[] = [
  {
    domain: 'sec.gov',
    name: 'SEC EDGAR Database',
    description: 'Official SEC filings and financial data',
    contentTypes: ['reports', 'spreadsheets', 'datasets'],
    searchCapabilities: ['web', 'files', 'spreadsheets'],
    priority: 10,
    categories: ['financial', 'regulatory', 'market-data'],
    fileExtensions: ['.xlsx', '.xls', '.csv', '.pdf', '.txt']
  },
  {
    domain: 'fred.stlouisfed.org',
    name: 'Federal Reserve Economic Data',
    description: 'Economic indicators and financial data',
    contentTypes: ['datasets', 'spreadsheets'],
    searchCapabilities: ['web', 'databases'],
    priority: 9,
    categories: ['economic', 'financial', 'market-data'],
    apiEndpoint: 'https://api.stlouisfed.org/fred/'
  },
  {
    domain: 'bloomberg.com',
    name: 'Bloomberg',
    description: 'Financial news and market data',
    contentTypes: ['articles', 'reports', 'spreadsheets'],
    searchCapabilities: ['web', 'files'],
    priority: 8,
    categories: ['financial', 'news', 'market-data']
  },
  {
    domain: 'reuters.com',
    name: 'Reuters',
    description: 'Financial and business news',
    contentTypes: ['articles', 'reports'],
    searchCapabilities: ['web'],
    priority: 8,
    categories: ['financial', 'news', 'business']
  },
  {
    domain: 'worldbank.org',
    name: 'World Bank Data',
    description: 'Global development indicators',
    contentTypes: ['datasets', 'spreadsheets', 'reports'],
    searchCapabilities: ['web', 'databases'],
    priority: 8,
    categories: ['economic', 'development', 'global'],
    apiEndpoint: 'https://api.worldbank.org/v2/'
  },
  {
    domain: 'imf.org',
    name: 'International Monetary Fund',
    description: 'Economic research and data',
    contentTypes: ['reports', 'datasets', 'spreadsheets'],
    searchCapabilities: ['web', 'files'],
    priority: 8,
    categories: ['economic', 'research', 'global']
  },
  {
    domain: 'bea.gov',
    name: 'Bureau of Economic Analysis',
    description: 'US economic statistics',
    contentTypes: ['datasets', 'reports', 'spreadsheets'],
    searchCapabilities: ['web', 'databases'],
    priority: 8,
    categories: ['economic', 'us', 'statistics']
  },
  {
    domain: 'census.gov',
    name: 'US Census Bureau',
    description: 'Demographic and economic data',
    contentTypes: ['datasets', 'reports', 'spreadsheets'],
    searchCapabilities: ['web', 'databases'],
    priority: 7,
    categories: ['demographic', 'economic', 'us']
  },
  {
    domain: 'finance.yahoo.com',
    name: 'Yahoo Finance',
    description: 'Stock market data and financial information',
    contentTypes: ['articles', 'spreadsheets', 'datasets'],
    searchCapabilities: ['web', 'files'],
    priority: 7,
    categories: ['financial', 'market-data', 'stocks']
  },
  {
    domain: 'investing.com',
    name: 'Investing.com',
    description: 'Financial markets and economic data',
    contentTypes: ['articles', 'datasets', 'spreadsheets'],
    searchCapabilities: ['web', 'files'],
    priority: 7,
    categories: ['financial', 'market-data', 'trading']
  }
]

// Helper functions for source management
export function getApprovedSourcesForQuery(query: string): ApprovedSource[] {
  const lowerQuery = query.toLowerCase()
  
  // Score sources based on query relevance
  const scoredSources = APPROVED_SOURCES.map(source => {
    let score = source.priority
    
    // Boost score based on category matches
    const categoryMatches = source.categories.filter(category => 
      lowerQuery.includes(category)
    ).length
    score += categoryMatches * 2
    
    // Boost score based on content type matches
    const contentMatches = source.contentTypes.filter(type => 
      lowerQuery.includes(type)
    ).length
    score += contentMatches * 1.5
    
    return { ...source, score }
  })
  
  // Sort by score and return top sources
  return scoredSources
    .sort((a, b) => b.score - a.score)
    .slice(0, 6) // Return top 6 for initial search
}

export function getNextBestSources(excludedDomains: string[]): ApprovedSource[] {
  return APPROVED_SOURCES
    .filter(source => !excludedDomains.includes(source.domain))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
}

export function isApprovedSource(url: string): boolean {
  const domain = new URL(url).hostname.replace('www.', '')
  return APPROVED_SOURCES.some(source => 
    domain.includes(source.domain) || source.domain.includes(domain)
  )
}

export function getSourceMetadata(url: string): ApprovedSource | null {
  const domain = new URL(url).hostname.replace('www.', '')
  return APPROVED_SOURCES.find(source => 
    domain.includes(source.domain) || source.domain.includes(domain)
  ) || null
} 

// Map of sector to domains
const SECTOR_DOMAINS: Record<string, string[]> = {
  Consumer: [
    'bloomberg.com', 'reuters.com', 'finance.yahoo.com', 'investing.com', 'census.gov', 'sec.gov'
  ],
  Healthcare: [
    'bloomberg.com', 'reuters.com', 'finance.yahoo.com', 'sec.gov', 'worldbank.org', 'imf.org'
  ],
  Industrials: [
    'bloomberg.com', 'reuters.com', 'finance.yahoo.com', 'sec.gov', 'bea.gov', 'investing.com'
  ],
  TMT: [ // Technology, Media, Telecom
    'bloomberg.com', 'reuters.com', 'finance.yahoo.com', 'sec.gov', 'investing.com', 'worldbank.org'
  ]
}

export function getApprovedSourcesForSector(sector: string): ApprovedSource[] {
  const domains = SECTOR_DOMAINS[sector] || []
  return APPROVED_SOURCES
    .filter(source => domains.includes(source.domain))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
} 