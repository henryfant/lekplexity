# AI Model Router Guide

The Fireplexity AI Model Router automatically selects the most appropriate OpenAI model based on task type and query complexity, optimizing for both quality insights and token costs.

## Overview

The model router analyzes each query and task to determine:
- Query complexity (low, medium, high)
- Whether reasoning capabilities are required
- Context length considerations
- Cost optimization preferences

## Available Models

| Model | Tier | Cost per 1M Input Tokens | Best For |
|-------|------|-------------------------|----------|
| gpt-4o-mini | Mini | $0.15 | Simple queries, scraping, follow-up questions |
| gpt-4o | Standard | $2.50 | Complex synthesis, data analysis |
| o1-mini | Reasoning | $3.00 | Deep reasoning, technical analysis |

## Task-Based Selection

### 1. Scraping (`scraping`)
- **Always uses**: `gpt-4o-mini`
- **Reason**: Cost-effective for basic content processing

### 2. Follow-up Questions (`follow_up`)
- **Always uses**: `gpt-4o-mini`
- **Reason**: Simple generation task that doesn't require advanced capabilities

### 3. Synthesis (`synthesis`)
- **Selection based on**:
  - Query complexity
  - Context length
  - Cost preferences
- **Examples**:
  - Simple "What is X?" → `gpt-4o-mini`
  - "Analyze market trends..." → `gpt-4o`
  - "Explain the logical reasoning behind..." → `o1-mini`

### 4. Data Extraction (`data_extraction`)
- **Selection based on**:
  - Query complexity
  - Precision requirements
- **Examples**:
  - Simple data lookup → `gpt-4o-mini`
  - Complex data analysis → `gpt-4o` or `o1-mini`

## Query Complexity Analysis

The router analyzes queries for complexity indicators:

### High Complexity
- Technical/analytical keywords: analyze, compare, evaluate, assess
- Multi-step reasoning: step by step, breakdown, walkthrough
- Financial analysis: valuation, ROI, risk assessment
- Research terms: methodology, hypothesis, framework

### Medium Complexity
- Summary requests: summarize, overview, key points
- Trend analysis: patterns, insights, findings
- Comparative analysis: pros and cons, advantages

### Low Complexity
- Simple questions: what is, who is, when, where
- Definitions: define, meaning
- Basic lookups: price, cost, contact info

## Configuration Options

### Environment Variables

```bash
# Force cost optimization (prefer cheaper models)
AI_PREFER_COST_OPTIMIZED=true

# Set maximum model tier (mini, standard, reasoning)
AI_MAX_MODEL_TIER=standard

# Force a specific model for all tasks
AI_FORCE_MODEL=gpt-4o
```

### Request Body Options

You can override model selection per request:

```json
{
  "query": "Your query here",
  "forceModel": "gpt-4o",        // Force specific model
  "preferCostOptimized": true    // Prefer cheaper models
}
```

## Example Model Selections

### Example 1: Simple Query
```
Query: "What is the stock price of Apple?"
Task: synthesis
Complexity: low
Selected Model: gpt-4o-mini
Reason: Simple factual lookup
```

### Example 2: Complex Analysis
```
Query: "Analyze the competitive landscape and market positioning of Tesla vs traditional automakers"
Task: synthesis  
Complexity: high
Selected Model: gpt-4o (or o1-mini if reasoning required)
Reason: Complex comparative analysis
```

### Example 3: Technical Reasoning
```
Query: "Explain the mathematical reasoning behind compound interest calculations"
Task: synthesis
Complexity: high + reasoning
Selected Model: o1-mini
Reason: Requires mathematical reasoning
```

## Cost Optimization Tips

1. **Use Environment Variables**: Set `AI_PREFER_COST_OPTIMIZED=true` for general cost savings
2. **Batch Simple Queries**: Group simple lookups to maximize gpt-4o-mini usage
3. **Monitor Logs**: Check console logs for model selection details and cost estimates
4. **Context Management**: Keep context concise to reduce token usage

## Monitoring

The router logs all model selections with:
- Selected model and reason
- Query complexity assessment  
- Estimated token count and cost
- Task type and context length

Example log:
```
[Model Router] {
  task: 'synthesis',
  queryLength: 85,
  complexity: 'high',
  selectedModel: 'gpt-4o',
  estimatedTokens: 2500,
  estimatedCost: '$0.0063',
  reason: 'Complexity: high, Task: synthesis, Large context'
}
```

## Best Practices

1. **Let the Router Decide**: The automatic selection is optimized for most use cases
2. **Override Sparingly**: Only force models when you have specific requirements
3. **Monitor Costs**: Review logs to understand your usage patterns
4. **Optimize Queries**: Clearer, more specific queries often allow for simpler models

## Troubleshooting

### Model Not Available
- Ensure your OpenAI API key has access to the selected models
- Check environment variables are properly set
- Verify model names match exactly (case-sensitive)

### Unexpected Model Selection
- Review query complexity indicators
- Check for environment variable overrides
- Examine context length impact
- Look for reasoning keywords that trigger o1-mini

### High Costs
- Enable cost optimization: `AI_PREFER_COST_OPTIMIZED=true`
- Set max tier: `AI_MAX_MODEL_TIER=standard`
- Review query patterns for optimization opportunities 