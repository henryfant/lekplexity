<div align="center">

# Fireplexity

A blazing-fast AI search engine powered by Firecrawl's web scraping API. Get intelligent answers with real-time citations and live data.

<img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjBxbWFxamZycWRkMmVhMGFiZnNuZjMxc3lpNHpuamR4OWlwa3F4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QbfaTCB1OmkRmIQwzJ/giphy.gif" width="100%" alt="Fireplexity Demo" />

</div>

## Features

- **Real-time Web Search** - Powered by Firecrawl's search API
- **Deep Data Search** - Extract specific data from high-quality sources
- **Intelligent Model Selection** - Automatic OpenAI model routing based on query complexity
- **AI Responses** - Streaming answers with optimized model selection
- **Source Citations** - Every claim backed by references
- **Live Stock Data** - Automatic TradingView charts
- **Smart Follow-ups** - AI-generated questions
- **Cost Optimization** - Smart model selection to balance quality and token costs

## Quick Start

### Clone & Install
```bash
git clone https://github.com/mendableai/fireplexity.git
cd fireplexity
npm install
```

### Set API Keys
```bash
cp .env.example .env.local
```

Add to `.env.local`:
```
FIRECRAWL_API_KEY=fc-your-api-key
OPENAI_API_KEY=sk-your-api-key

# Optional: Customize AI behavior
AI_SYSTEM_PROMPT="Your custom system prompt here"
AI_FOLLOWUP_SYSTEM_PROMPT="Your custom follow-up prompt here"

# Optional: Model Router Configuration
AI_PREFER_COST_OPTIMIZED=true  # Prefer cheaper models when possible
AI_MAX_MODEL_TIER=reasoning     # Options: mini, standard, reasoning
AI_FORCE_MODEL=gpt-4o          # Force specific model (overrides auto-selection)
```

### Run
```bash
npm run dev
```

Visit http://localhost:3000

## AI Model Router

Fireplexity includes an intelligent model router that automatically selects the best OpenAI model based on:
- **Query complexity** - Simple vs. complex analysis
- **Task type** - Scraping, synthesis, or data extraction
- **Context length** - Adjusts for large contexts
- **Cost optimization** - Balances quality with token costs

Models used:
- `gpt-4o-mini` - Simple queries, scraping (lowest cost)
- `gpt-4o` - Complex synthesis, analysis
- `o1-mini` - Deep reasoning, technical analysis

See [Model Router Guide](MODEL_ROUTER_GUIDE.md) for detailed configuration.

## Tech Stack

- **Firecrawl** - Web scraping API
- **Next.js 15** - React framework
- **OpenAI** - Multiple models with automatic selection
- **Vercel AI SDK** - Streaming
- **TradingView** - Stock charts

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmendableai%2Ffireplexity)

## Resources

- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Get API Key](https://firecrawl.dev)
- [Discord Community](https://discord.gg/firecrawl)
- [AI System Prompt Configuration](AI_SYSTEM_PROMPT_SETUP.md)
- [Deep Data Search Guide](DEEP_SEARCH_GUIDE.md)
- [AI Model Router Guide](MODEL_ROUTER_GUIDE.md)

## License

MIT License

---

Powered by [Firecrawl](https://firecrawl.dev)
