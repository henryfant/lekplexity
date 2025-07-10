# Deep Data Search Guide

Fireplexity's Deep Data Search is a specialized feature that focuses on extracting specific data points from pre-approved high-quality sources. This guide explains how to use this powerful tool effectively.

## What is Deep Data Search?

Deep Data Search is designed for users who need:
- **Precise data extraction** from trusted sources
- **Deep dives** into specific data points
- **High-quality, verified information** from authoritative sources
- **Comprehensive coverage** of files, spreadsheets, and databases

## Key Features

### 🎯 **Pre-Approved Sources Only**
The system only searches through carefully curated, high-quality sources including:
- **SEC EDGAR Database** - Official financial filings
- **Federal Reserve Economic Data** - Economic indicators
- **Bloomberg** - Financial news and market data
- **Reuters** - Business and financial news
- **World Bank Data** - Global development indicators
- **IMF** - Economic research and data
- **Bureau of Economic Analysis** - US economic statistics
- **US Census Bureau** - Demographic and economic data
- **Yahoo Finance** - Stock market data
- **Investing.com** - Financial markets data

### 🔍 **Intelligent Source Selection**
- Automatically selects the most relevant 2-3 sources for your query
- Uses AI to determine which sources are most likely to contain your data
- Prioritizes sources based on content type and domain expertise

### 📊 **Deep Content Search**
- Searches through web pages, files, spreadsheets, and databases
- Extracts specific data points like numbers, percentages, dates, and metrics
- Provides relevance scoring for each result

### 🔄 **Iterative Search Process**
- If data isn't found in initial sources, suggests the next best sources
- Allows you to search additional sources without starting over
- Maintains conversation context throughout the process

## How to Use Deep Data Search

### 1. **Access Deep Search**
- Navigate to `/deep-search` or click "Deep Data Search" in the navigation
- The interface is specifically designed for data-focused queries

### 2. **Formulate Your Query**
Be specific about the data you're looking for:

**Good Examples:**
- "What was Apple's revenue in Q3 2023?"
- "What is the current US inflation rate?"
- "What is Tesla's market cap as of today?"
- "What was the GDP growth rate for China in 2022?"

**Less Effective:**
- "Tell me about Apple" (too broad)
- "What's happening in the economy?" (not data-specific)

### 3. **Review Results**
The system will:
1. **Search the most relevant sources** for your specific data point
2. **Extract and present** the exact data you requested
3. **Provide source citations** with [1], [2], etc.
4. **Show relevance scores** for each source

### 4. **Handle Missing Data**
If the specific data isn't found in the initial sources:
- The AI will clearly state what was searched
- Suggest additional high-quality sources to try
- Provide a "Search This Source" button for each suggested source

### 5. **Iterate and Refine**
- Click "Search This Source" to search additional sources
- Ask follow-up questions to get more specific data
- The system maintains context of your previous searches

## Example Workflow

### Query: "What was Tesla's revenue in 2023?"

1. **Initial Search**: System searches SEC EDGAR, Yahoo Finance, and Bloomberg
2. **Results**: Finds Tesla's 2023 revenue data from SEC filings
3. **Presentation**: Shows exact revenue figure with source citation
4. **Additional Context**: May show quarterly breakdowns and year-over-year growth

### If Data Not Found:
1. **Clear Statement**: "I searched SEC, Yahoo Finance, and Bloomberg but couldn't find Tesla's 2023 revenue"
2. **Suggestions**: Recommends checking Reuters, Investing.com, or Tesla's investor relations
3. **Easy Access**: "Search This Source" buttons for each suggested source

## Best Practices

### ✅ **Do:**
- Ask for specific data points (numbers, dates, percentages)
- Be clear about the time period you're interested in
- Use company names, ticker symbols, or specific metrics
- Ask follow-up questions for additional context

### ❌ **Don't:**
- Ask broad, general questions
- Request opinions or analysis (use regular search instead)
- Ask for data that might not be publicly available
- Use vague terms like "recent" or "latest" without context

## Technical Details

### Source Prioritization
The system uses an intelligent scoring algorithm that considers:
- **Domain relevance** to your query
- **Content type** (financial data, economic indicators, etc.)
- **Source authority** and reliability
- **Data freshness** and availability

### Search Depth
For each source, the system searches:
- **Web pages** - Main content and articles
- **Files** - PDFs, documents, and reports
- **Spreadsheets** - Excel files and CSV data
- **Databases** - Structured data and APIs

### Data Extraction
The AI is specifically trained to:
- Identify and extract numerical data
- Recognize dates, percentages, and currencies
- Provide context for data points
- Note data limitations or caveats

## Comparison: Regular Search vs Deep Search

| Feature | Regular Search | Deep Search |
|---------|----------------|-------------|
| **Sources** | All web sources | Pre-approved high-quality only |
| **Focus** | General information | Specific data points |
| **Depth** | Surface-level content | Deep file/database search |
| **Speed** | Fast, broad results | Slower, precise results |
| **Use Case** | General research, opinions | Data extraction, facts |

## Troubleshooting

### "No data found" responses:
1. **Check your query** - Make sure you're asking for specific data
2. **Try different sources** - Use the suggested additional sources
3. **Refine your question** - Be more specific about what you need
4. **Check time periods** - Some data might not be available for certain dates

### Slow responses:
- Deep search takes longer because it searches multiple content types
- Complex queries may require searching multiple sources
- Be patient - the system is doing thorough research

### Missing sources:
- The system only searches pre-approved sources for quality control
- If you need broader search, use the regular search feature
- New sources can be added to the approved list by updating the configuration

## Configuration

You can customize the deep search behavior by setting environment variables:

```bash
# Customize the AI's data extraction behavior
AI_DEEP_DATA_SYSTEM_PROMPT="Your custom deep data prompt here"

# Add or modify approved sources in lib/approved-sources.ts
```

## Support

For questions about Deep Data Search:
- Check the [AI System Prompt Configuration](AI_SYSTEM_PROMPT_SETUP.md)
- Review the [main README](README.md)
- Visit the [Firecrawl documentation](https://docs.firecrawl.dev)

---

**Ready to get started?** Navigate to `/deep-search` and try asking for a specific data point! 