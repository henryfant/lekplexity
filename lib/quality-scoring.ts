import { SearchResult, DataPoint } from './search-strategies'
import { CrawlResult } from './intelligent-crawler'

export interface QualityMetrics {
  authorityScore: number
  freshnessScore: number
  completenessScore: number
  accuracyScore: number
  relevanceScore: number
  overallScore: number
  confidence: number
  explanation: string
}

export interface ScoredResult extends SearchResult {
  qualityMetrics: QualityMetrics
  verificationStatus: 'verified' | 'partial' | 'unverified'
  crossReferences: string[]
}

export class QualityScorer {
  private sourceAuthorityCache: Map<string, number> = new Map()
  private dataVerificationCache: Map<string, boolean> = new Map()

  constructor() {
    // Initialize with known authority scores
    this.initializeAuthorityScores()
  }

  private initializeAuthorityScores(): void {
    // Government sources - highest authority
    const govSources = ['census.gov', 'bls.gov', 'fda.gov', 'cdc.gov', 'cms.gov', 'eia.gov']
    govSources.forEach(domain => this.sourceAuthorityCache.set(domain, 0.95))

    // Major research firms
    const researchSources = ['gartner.com', 'idc.com', 'iqvia.com', 'nielsen.com']
    researchSources.forEach(domain => this.sourceAuthorityCache.set(domain, 0.85))

    // Industry associations
    const industrySources = ['americanchemistry.com', 'aha.org', 'phrma.org', 'steel.org']
    industrySources.forEach(domain => this.sourceAuthorityCache.set(domain, 0.80))

    // Academic sources
    const academicSources = ['edu', 'academic', 'journal']
    academicSources.forEach(domain => this.sourceAuthorityCache.set(domain, 0.85))
  }

  async scoreResults(
    results: SearchResult[],
    query: string,
    sector?: string // Now accepts optional sector
  ): Promise<ScoredResult[]> {
    const scoredResults: ScoredResult[] = []

    // First pass: Score individual results
    for (const result of results) {
      const metrics = await this.calculateQualityMetrics(result, query, sector)
      const verificationStatus = this.determineVerificationStatus(result, results)
      const crossReferences = this.findCrossReferences(result, results)

      scoredResults.push({
        ...result,
        qualityMetrics: metrics,
        verificationStatus,
        crossReferences
      })
    }

    // Second pass: Adjust scores based on cross-validation
    return this.adjustScoresWithCrossValidation(scoredResults)
  }

  private async calculateQualityMetrics(
    result: SearchResult,
    query: string,
    sector?: string
  ): Promise<QualityMetrics> {
    const authorityScore = this.calculateAuthorityScore(result)
    const freshnessScore = this.calculateFreshnessScore(result)
    const completenessScore = this.calculateCompletenessScore(result, query)
    const accuracyScore = await this.calculateAccuracyScore(result)
    const relevanceScore = this.calculateRelevanceScore(result, query, sector)

    // Weighted overall score
    const weights = {
      authority: 0.25,
      freshness: 0.15,
      completeness: 0.20,
      accuracy: 0.25,
      relevance: 0.15
    }

    const overallScore = 
      authorityScore * weights.authority +
      freshnessScore * weights.freshness +
      completenessScore * weights.completeness +
      accuracyScore * weights.accuracy +
      relevanceScore * weights.relevance

    const confidence = this.calculateConfidence(result, overallScore)

    const explanation = this.generateQualityExplanation({
      authorityScore,
      freshnessScore,
      completenessScore,
      accuracyScore,
      relevanceScore,
      overallScore
    })

    return {
      authorityScore,
      freshnessScore,
      completenessScore,
      accuracyScore,
      relevanceScore,
      overallScore,
      confidence,
      explanation
    }
  }

  private calculateAuthorityScore(result: SearchResult): number {
    let score = 0.5 // Base score

    // Check cached authority
    const domain = new URL(result.url).hostname.replace('www.', '')
    const cachedAuthority = this.sourceAuthorityCache.get(domain)
    if (cachedAuthority) {
      score = Math.max(score, cachedAuthority)
    }

    // Check for institutional indicators
    if (domain.endsWith('.gov')) score = Math.max(score, 0.95)
    if (domain.endsWith('.edu')) score = Math.max(score, 0.85)
    if (domain.includes('.org')) score = Math.max(score, 0.75)

    // Check for SSL and other trust indicators
    if (result.url.startsWith('https://')) score += 0.05

    return Math.min(score, 1)
  }

  private calculateFreshnessScore(result: SearchResult): number {
    // Extract dates from content
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
      /Q[1-4]\s+\d{4}/g
    ]

    let mostRecentDate: Date | null = null
    const now = new Date()

    for (const pattern of datePatterns) {
      const matches = result.content.matchAll(pattern)
      for (const match of matches) {
        try {
          const date = new Date(match[0])
          if (!isNaN(date.getTime()) && (!mostRecentDate || date > mostRecentDate)) {
            mostRecentDate = date
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    }

    if (!mostRecentDate) return 0.5 // No date found

    // Calculate age in days
    const ageInDays = (now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24)

    // Scoring based on age
    if (ageInDays <= 30) return 1.0
    if (ageInDays <= 90) return 0.9
    if (ageInDays <= 180) return 0.8
    if (ageInDays <= 365) return 0.7
    if (ageInDays <= 730) return 0.5
    return 0.3
  }

  private calculateCompletenessScore(result: SearchResult, query: string): number {
    let score = 0

    // Check if result addresses main query components
    const queryTerms = query.toLowerCase().split(/\s+/)
    const contentLower = result.content.toLowerCase()
    
    let termsFound = 0
    for (const term of queryTerms) {
      if (contentLower.includes(term)) termsFound++
    }
    score += (termsFound / queryTerms.length) * 0.3

    // Check for data points
    if (result.dataPoints.length > 0) score += 0.2
    if (result.dataPoints.length > 5) score += 0.1
    if (result.dataPoints.length > 10) score += 0.1

    // Check for comprehensive coverage indicators
    const coverageIndicators = [
      'overview', 'summary', 'comprehensive', 'detailed',
      'analysis', 'report', 'study', 'research'
    ]
    
    for (const indicator of coverageIndicators) {
      if (contentLower.includes(indicator)) {
        score += 0.05
      }
    }

    // Check content length (longer often means more complete)
    if (result.content.length > 500) score += 0.1
    if (result.content.length > 2000) score += 0.1

    return Math.min(score, 1)
  }

  private async calculateAccuracyScore(result: SearchResult): Promise<number> {
    let score = 0.7 // Base accuracy assumption

    // Check for high-confidence data points
    const highConfidenceData = result.dataPoints.filter(dp => dp.confidence > 0.8)
    if (highConfidenceData.length > 0) {
      score += 0.1
    }

    // Check for citations or references
    const citationPatterns = [
      /\[\d+\]/g, // [1], [2], etc.
      /\(\d{4}\)/g, // (2023), etc.
      /Source:/gi,
      /Reference:/gi,
      /According to/gi
    ]

    let citationCount = 0
    for (const pattern of citationPatterns) {
      citationCount += (result.content.match(pattern) || []).length
    }

    if (citationCount > 0) score += 0.1
    if (citationCount > 5) score += 0.1

    // Check for verification in cache
    const cacheKey = `${result.url}-${result.dataPoints.map(dp => dp.value).join(',')}`
    const isVerified = this.dataVerificationCache.get(cacheKey)
    if (isVerified === true) score = 0.95
    if (isVerified === false) score = 0.3

    return Math.min(score, 1)
  }

  private calculateRelevanceScore(result: SearchResult, query: string, sector?: string): number {
    // Use existing relevance score as base
    let score = result.confidence || 0.5

    // Boost for query term proximity
    const queryTerms = query.toLowerCase().split(/\s+/)
    const contentWords = result.content.toLowerCase().split(/\s+/)
    
    for (let i = 0; i < contentWords.length - queryTerms.length; i++) {
      const window = contentWords.slice(i, i + queryTerms.length).join(' ')
      if (queryTerms.every(term => window.includes(term))) {
        score += 0.1
      }
    }

    // Boost for title relevance
    if (result.title) {
      const titleLower = result.title.toLowerCase()
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 0.05
      }
    }

    // Boost if sector is relevant
    if (sector) {
      const contentLower = result.content.toLowerCase()
      const titleLower = result.title?.toLowerCase() || ''
      const urlLower = result.url.toLowerCase()
      
      if (
        contentLower.includes(sector.toLowerCase()) ||
        titleLower.includes(sector.toLowerCase()) ||
        urlLower.includes(sector.toLowerCase())
      ) {
        score += 0.15
      }
    }

    return Math.min(score, 1)
  }

  private calculateConfidence(result: SearchResult, overallScore: number): number {
    let confidence = overallScore

    // Adjust based on data point confidence
    if (result.dataPoints.length > 0) {
      const avgDataConfidence = result.dataPoints.reduce((sum, dp) => sum + dp.confidence, 0) / result.dataPoints.length
      confidence = (confidence + avgDataConfidence) / 2
    }

    // Adjust based on strategy used
    if (result.strategy === 'Direct API Access') confidence += 0.1
    if (result.strategy === 'Cross-Reference Validation') confidence += 0.05

    return Math.min(confidence, 1)
  }

  private determineVerificationStatus(
    result: SearchResult,
    allResults: SearchResult[]
  ): 'verified' | 'partial' | 'unverified' {
    // Check if data points are corroborated by other sources
    let verifiedDataPoints = 0
    
    for (const dp of result.dataPoints) {
      const corroborating = allResults.filter(r => 
        r.url !== result.url &&
        r.dataPoints.some(otherDp => 
          this.areDataPointsSimilar(dp, otherDp)
        )
      )
      
      if (corroborating.length > 0) verifiedDataPoints++
    }

    const verificationRatio = result.dataPoints.length > 0 
      ? verifiedDataPoints / result.dataPoints.length 
      : 0

    if (verificationRatio >= 0.8) return 'verified'
    if (verificationRatio >= 0.3) return 'partial'
    return 'unverified'
  }

  private areDataPointsSimilar(dp1: DataPoint, dp2: DataPoint): boolean {
    if (dp1.type !== dp2.type) return false

    const value1 = String(dp1.value).replace(/[^0-9.]/g, '')
    const value2 = String(dp2.value).replace(/[^0-9.]/g, '')

    if (!value1 || !value2) return dp1.value === dp2.value

    const num1 = parseFloat(value1)
    const num2 = parseFloat(value2)

    if (isNaN(num1) || isNaN(num2)) return false

    // Allow 5% variance
    const variance = Math.abs(num1 - num2) / Math.max(num1, num2)
    return variance < 0.05
  }

  private findCrossReferences(result: SearchResult, allResults: SearchResult[]): string[] {
    const references: string[] = []

    for (const dp of result.dataPoints) {
      const corroborating = allResults.filter(r => 
        r.url !== result.url &&
        r.dataPoints.some(otherDp => 
          this.areDataPointsSimilar(dp, otherDp)
        )
      )

      for (const ref of corroborating) {
        if (!references.includes(ref.url)) {
          references.push(ref.url)
        }
      }
    }

    return references
  }

  private adjustScoresWithCrossValidation(results: ScoredResult[]): ScoredResult[] {
    // Group results by similar data points
    const dataGroups = new Map<string, ScoredResult[]>()

    for (const result of results) {
      for (const dp of result.dataPoints) {
        const key = `${dp.type}-${String(dp.value).replace(/[^0-9.]/g, '')}`
        const group = dataGroups.get(key) || []
        group.push(result)
        dataGroups.set(key, group)
      }
    }

    // Boost scores for corroborated data
    for (const [key, group] of dataGroups) {
      if (group.length > 1) {
        // Multiple sources have similar data - boost accuracy
        for (const result of group) {
          result.qualityMetrics.accuracyScore = Math.min(
            result.qualityMetrics.accuracyScore + 0.1,
            1
          )
          
          // Recalculate overall score
          result.qualityMetrics.overallScore = this.recalculateOverallScore(result.qualityMetrics)
        }
      }
    }

    return results.sort((a, b) => b.qualityMetrics.overallScore - a.qualityMetrics.overallScore)
  }

  private recalculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      authority: 0.25,
      freshness: 0.15,
      completeness: 0.20,
      accuracy: 0.25,
      relevance: 0.15
    }

    return (
      metrics.authorityScore * weights.authority +
      metrics.freshnessScore * weights.freshness +
      metrics.completenessScore * weights.completeness +
      metrics.accuracyScore * weights.accuracy +
      metrics.relevanceScore * weights.relevance
    )
  }

  private generateQualityExplanation(scores: Omit<QualityMetrics, 'confidence' | 'explanation'>): string {
    const explanations: string[] = []

    if (scores.authorityScore >= 0.9) {
      explanations.push('Highly authoritative source')
    } else if (scores.authorityScore >= 0.7) {
      explanations.push('Reputable source')
    }

    if (scores.freshnessScore >= 0.9) {
      explanations.push('Very recent data')
    } else if (scores.freshnessScore <= 0.5) {
      explanations.push('Data may be outdated')
    }

    if (scores.completenessScore >= 0.8) {
      explanations.push('Comprehensive coverage')
    }

    if (scores.accuracyScore >= 0.9) {
      explanations.push('High confidence in accuracy')
    }

    if (scores.relevanceScore >= 0.8) {
      explanations.push('Highly relevant to query')
    }

    return explanations.join('. ') || 'Standard quality result'
  }

  // Public method to update authority scores based on user feedback
  updateAuthorityScore(domain: string, adjustment: number): void {
    const current = this.sourceAuthorityCache.get(domain) || 0.5
    const newScore = Math.max(0, Math.min(1, current + adjustment))
    this.sourceAuthorityCache.set(domain, newScore)
  }

  // Public method to mark data as verified/unverified
  markDataVerification(url: string, dataPoints: DataPoint[], verified: boolean): void {
    const cacheKey = `${url}-${dataPoints.map(dp => dp.value).join(',')}`
    this.dataVerificationCache.set(cacheKey, verified)
  }
}

// Export singleton instance
export const qualityScorer = new QualityScorer() 