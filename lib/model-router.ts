// AI Model Router - Automatically selects the best OpenAI model based on task and query complexity

export type ModelTask = 'scraping' | 'synthesis' | 'follow_up' | 'data_extraction'
export type ModelTier = 'mini' | 'standard' | 'advanced' | 'reasoning'

export interface ModelConfig {
  modelId: string
  tier: ModelTier
  costPerMillion: number // Input token cost
  capabilities: string[]
}

// Available OpenAI models with their capabilities and costs
export const OPENAI_MODELS: Record<string, ModelConfig> = {
  'gpt-4o-mini': {
    modelId: 'gpt-4o-mini',
    tier: 'mini',
    costPerMillion: 0.15, // $0.15 per 1M input tokens
    capabilities: ['basic', 'fast', 'scraping', 'simple_queries']
  },
  'gpt-4o': {
    modelId: 'gpt-4o',
    tier: 'standard',
    costPerMillion: 2.50, // $2.50 per 1M input tokens
    capabilities: ['advanced', 'synthesis', 'complex_queries', 'data_analysis']
  },
  'o1-mini': {
    modelId: 'o1-mini',
    tier: 'reasoning',
    costPerMillion: 3.00, // $3.00 per 1M input tokens
    capabilities: ['reasoning', 'complex_synthesis', 'deep_analysis', 'technical']
  }
}

// Query complexity indicators
const COMPLEXITY_INDICATORS = {
  high: [
    // Technical/analytical keywords
    'analyze', 'compare', 'evaluate', 'assess', 'explain how', 'explain why',
    'implications', 'correlation', 'causation', 'forecast', 'predict',
    'synthesize', 'integrate', 'derive', 'calculate', 'model',
    
    // Financial/business analysis
    'financial analysis', 'market analysis', 'competitive analysis',
    'valuation', 'roi', 'risk assessment', 'strategic', 'optimization',
    
    // Research/academic
    'research', 'methodology', 'hypothesis', 'theory', 'framework',
    'systematic', 'comprehensive', 'in-depth', 'detailed analysis',
    
    // Multi-step reasoning
    'step by step', 'breakdown', 'walkthrough', 'process',
    'how does', 'why does', 'what causes', 'relationship between'
  ],
  
  medium: [
    // Moderate complexity
    'summarize', 'overview', 'key points', 'main', 'important',
    'trends', 'patterns', 'insights', 'findings', 'results',
    'pros and cons', 'advantages', 'disadvantages', 'benefits',
    'recent', 'current', 'latest', 'update', 'news'
  ],
  
  low: [
    // Simple queries
    'what is', 'who is', 'when', 'where', 'define', 'meaning',
    'list', 'name', 'mention', 'state', 'price', 'cost',
    'contact', 'address', 'phone', 'email', 'website',
    'yes or no', 'true or false', 'fact'
  ]
}

// Analyze query complexity
export function analyzeQueryComplexity(query: string): 'low' | 'medium' | 'high' {
  const lowerQuery = query.toLowerCase()
  
  // Check for high complexity indicators
  const highComplexityScore = COMPLEXITY_INDICATORS.high.filter(
    indicator => lowerQuery.includes(indicator)
  ).length
  
  if (highComplexityScore >= 2) return 'high'
  if (highComplexityScore === 1) {
    // Check query length and structure
    const wordCount = query.split(/\s+/).length
    if (wordCount > 30) return 'high'
  }
  
  // Check for medium complexity
  const mediumComplexityScore = COMPLEXITY_INDICATORS.medium.filter(
    indicator => lowerQuery.includes(indicator)
  ).length
  
  if (mediumComplexityScore >= 1 || query.split(/\s+/).length > 15) {
    return 'medium'
  }
  
  // Default to low complexity
  return 'low'
}

// Analyze if query requires reasoning capabilities
export function requiresReasoning(query: string): boolean {
  const reasoningIndicators = [
    'explain the reasoning', 'logical', 'deduce', 'infer', 'conclude',
    'prove', 'justify', 'argue', 'debate', 'critical analysis',
    'cause and effect', 'if then', 'hypothesis', 'theory',
    'mathematical', 'algorithm', 'formula', 'equation'
  ]
  
  const lowerQuery = query.toLowerCase()
  return reasoningIndicators.some(indicator => lowerQuery.includes(indicator))
}

// Get environment preferences
export function getModelPreferences(): {
  preferCostOptimized: boolean
  maxModelTier: ModelTier
  forceModel?: string
} {
  const preferCostOptimized = process.env.AI_PREFER_COST_OPTIMIZED === 'true'
  const maxModelTier = (process.env.AI_MAX_MODEL_TIER as ModelTier) || 'reasoning'
  const forceModel = process.env.AI_FORCE_MODEL
  
  return {
    preferCostOptimized,
    maxModelTier,
    forceModel
  }
}

// Select model based on task and query
export function selectModel(
  task: ModelTask,
  query: string,
  options?: {
    forceModel?: string
    preferCostOptimized?: boolean
    contextLength?: number
  }
): string {
  // Get environment preferences
  const envPrefs = getModelPreferences()
  
  // Merge options with environment preferences
  const mergedOptions = {
    forceModel: options?.forceModel || envPrefs.forceModel,
    preferCostOptimized: options?.preferCostOptimized ?? envPrefs.preferCostOptimized,
    contextLength: options?.contextLength
  }
  
  // If a specific model is forced, use it
  if (mergedOptions.forceModel && OPENAI_MODELS[mergedOptions.forceModel]) {
    return mergedOptions.forceModel
  }
  
  // Task-based selection
  if (task === 'scraping') {
    // Always use mini for scraping to save costs
    return 'gpt-4o-mini'
  }
  
  if (task === 'follow_up') {
    // Follow-up questions don't need powerful models
    return 'gpt-4o-mini'
  }
  
  // For synthesis and data extraction, analyze query complexity
  const complexity = analyzeQueryComplexity(query)
  const needsReasoning = requiresReasoning(query)
  
  // Check if we should consider context length for model selection
  const hasLargeContext = mergedOptions.contextLength && mergedOptions.contextLength > 10000
  
  // If reasoning is required and we're not cost-optimized, use o1-mini
  if (needsReasoning && !mergedOptions.preferCostOptimized && envPrefs.maxModelTier === 'reasoning') {
    return 'o1-mini'
  }
  
  // Synthesis task model selection
  if (task === 'synthesis') {
    switch (complexity) {
      case 'high':
        if (mergedOptions.preferCostOptimized || envPrefs.maxModelTier === 'standard') {
          return 'gpt-4o'
        }
        return envPrefs.maxModelTier === 'reasoning' ? 'o1-mini' : 'gpt-4o'
      case 'medium':
        return hasLargeContext || !mergedOptions.preferCostOptimized ? 'gpt-4o' : 'gpt-4o-mini'
      case 'low':
        return 'gpt-4o-mini'
    }
  }
  
  // Data extraction task model selection
  if (task === 'data_extraction') {
    // Data extraction benefits from structured thinking
    if (complexity === 'high' && !mergedOptions.preferCostOptimized) {
      return envPrefs.maxModelTier === 'reasoning' ? 'o1-mini' : 'gpt-4o'
    }
    return complexity === 'high' ? 'gpt-4o' : 'gpt-4o-mini'
  }
  
  // Default fallback
  return 'gpt-4o-mini'
}

// Estimate token costs for a request
export function estimateTokenCost(
  text: string,
  modelId: string
): { tokens: number; estimatedCost: number } {
  // Rough estimation: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil(text.length / 4)
  const model = OPENAI_MODELS[modelId]
  
  if (!model) {
    return { tokens: estimatedTokens, estimatedCost: 0 }
  }
  
  const estimatedCost = (estimatedTokens / 1_000_000) * model.costPerMillion
  
  return {
    tokens: estimatedTokens,
    estimatedCost
  }
}

// Log model selection for monitoring
export function logModelSelection(
  task: ModelTask,
  query: string,
  selectedModel: string,
  reason?: string
): void {
  const complexity = analyzeQueryComplexity(query)
  const { tokens, estimatedCost } = estimateTokenCost(query, selectedModel)
  
  console.log('[Model Router]', {
    task,
    queryLength: query.length,
    complexity,
    selectedModel,
    estimatedTokens: tokens,
    estimatedCost: `$${estimatedCost.toFixed(4)}`,
    reason: reason || `Complexity: ${complexity}, Task: ${task}`
  })
}

// Get model configuration
export function getModelConfig(modelId: string): ModelConfig | null {
  return OPENAI_MODELS[modelId] || null
} 

// Export model selection summary for UI display
export interface ModelSelectionSummary {
  task: ModelTask
  query: string
  selectedModel: string
  complexity: 'low' | 'medium' | 'high'
  estimatedCost: number
  reason: string
}

export function getModelSelectionSummary(
  task: ModelTask,
  query: string,
  selectedModel: string,
  contextLength?: number
): ModelSelectionSummary {
  const complexity = analyzeQueryComplexity(query)
  const fullText = query + (contextLength ? ' '.repeat(contextLength) : '')
  const { estimatedCost } = estimateTokenCost(fullText, selectedModel)
  
  let reason = `Query complexity: ${complexity}, Task: ${task}`
  if (requiresReasoning(query)) {
    reason += ', Requires reasoning'
  }
  if (contextLength && contextLength > 10000) {
    reason += ', Large context'
  }
  
  return {
    task,
    query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
    selectedModel,
    complexity,
    estimatedCost,
    reason
  }
} 