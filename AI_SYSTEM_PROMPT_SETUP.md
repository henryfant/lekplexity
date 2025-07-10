# AI System Prompt Configuration

This document explains how to customize the AI system prompts used by Fireplexity for conducting searches and generating responses.

## Environment Variables

You can customize the AI's behavior by setting these environment variables in your `.env.local` file:

### `AI_SYSTEM_PROMPT`
The main system prompt that controls how the AI responds to user queries.

**Default:**
```
You are a friendly assistant that helps users find information.

RESPONSE STYLE:
- For greetings (hi, hello), respond warmly and ask how you can help
- For simple questions, give direct, concise answers
- For complex topics, provide detailed explanations only when needed
- Match the user's energy level - be brief if they're brief

FORMAT:
- Use markdown for readability when appropriate
- Keep responses natural and conversational
- Include citations inline as [1], [2], etc. when referencing specific sources
- Citations should correspond to the source order (first source = [1], second = [2], etc.)
- Use the format [1] not CITATION_1 or any other format
```

**Example Custom Prompt:**
```bash
AI_SYSTEM_PROMPT="You are a professional research assistant specializing in financial and market analysis. Provide detailed, accurate responses with proper citations. Always include relevant data points and market context when discussing companies or investments."
```

### `AI_FOLLOWUP_SYSTEM_PROMPT`
Controls how the AI generates follow-up questions after providing an answer.

**Default:**
```
Generate 5 natural follow-up questions based on the query and context.

ONLY generate questions if the query warrants them:
- Skip for simple greetings or basic acknowledgments
- Create questions that feel natural, not forced
- Make them genuinely helpful, not just filler
- Focus on the topic and sources available

If the query doesn't need follow-ups, return an empty response.
Return only the questions, one per line, no numbering or bullets.
```

**Example Custom Prompt:**
```bash
AI_FOLLOWUP_SYSTEM_PROMPT="Generate 3-5 insightful follow-up questions that explore different aspects of the topic. Focus on practical applications, deeper analysis, or related areas that would benefit the user."
```

## Setup Instructions

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your API keys:
   ```bash
   FIRECRAWL_API_KEY=fc-your-api-key
   OPENAI_API_KEY=sk-your-api-key
   ```
3. Add your custom system prompts:
   ```bash
   AI_SYSTEM_PROMPT="Your custom system prompt here"
   AI_FOLLOWUP_SYSTEM_PROMPT="Your custom follow-up prompt here"
   ```
4. Restart your development server

## Prompt Guidelines

When customizing prompts, consider:

- **Role Definition**: Clearly define the AI's role and expertise
- **Response Style**: Specify tone, length, and format preferences
- **Citation Format**: Maintain the [1], [2] citation format for consistency
- **Context Awareness**: Include instructions for handling follow-up questions
- **Specialization**: Add domain-specific instructions if needed

## Examples by Use Case

### Financial Research Assistant
```bash
AI_SYSTEM_PROMPT="You are a financial research assistant. Provide detailed market analysis with specific data points, risk assessments, and investment considerations. Always cite sources and include relevant financial metrics when discussing companies or markets."
```

### Academic Research Helper
```bash
AI_SYSTEM_PROMPT="You are an academic research assistant. Provide comprehensive, well-structured responses with proper citations. Include methodology considerations, limitations, and suggest further research directions when appropriate."
```

### Technical Documentation Expert
```bash
AI_SYSTEM_PROMPT="You are a technical documentation expert. Provide clear, step-by-step explanations with code examples when relevant. Focus on practical implementation and troubleshooting guidance."
```

## Troubleshooting

- **Prompts not taking effect**: Ensure you've restarted your development server
- **Environment variables not loading**: Check that your `.env.local` file is in the project root
- **Syntax errors**: Make sure your prompts are properly quoted and escaped

## Code Structure

The system prompts are managed in `lib/ai-config.ts` and used by both search API routes:
- `app/api/fireplexity/search/route.ts`
- `app/api/fire-cache/search/route.ts`

You can modify the configuration logic in `lib/ai-config.ts` if you need more advanced prompt management features. 