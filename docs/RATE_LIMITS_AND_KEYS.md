# Rate Limits & Key Rotation

Jasmine supports multi-key rotation and provider fallback to avoid hitting rate limits.

## Multi-Key Format

Use **comma-separated** keys in any env var:

```
AI_GATEWAY_API_KEY=key1,key2,key3
OPENROUTER_API_KEY=key1,key2
VITE_GEMINI_API_KEY=key1,key2
SERPER_API_KEY=key1,key2
```

Or **numbered** suffixes:

```
AI_GATEWAY_API_KEY=key1
AI_GATEWAY_API_KEY_2=key2
AI_GATEWAY_API_KEY_3=key3
```

On 429 (rate limit), the system tries the next key automatically. Up to 3 retries with backoff.

---

## Provider Fallback Chains

### Text Generation (server: `/api/ai`)
1. Vercel AI Gateway (AI_GATEWAY_API_KEY)
2. OpenRouter (OPENROUTER_API_KEY) — same models, different quota

### Text Generation (client direct)
- **Gemini**: VITE_GEMINI_API_KEY — multi-key retry on 429
- **Groq**: VITE_GROQ_API_KEY — multi-key retry on 429
- **OpenAI**: VITE_OPENAI_API_KEY — multi-key retry on 429
- **Gateway**: No client key — server handles rotation

### Image Generation (`/api/generate-image`)
1. OpenRouter (google/gemini-2.5-flash-image)
2. AI Gateway
3. OpenAI DALL-E 3
4. Replicate Flux
5. Gemini REST/SDK

Each provider supports multi-key. Tries next key on 429.

### Web Search (`/api/web-search`)
1. Serper
2. Tavily
3. Brave Search (BRAVE_API_KEY)

Multi-key for each. Tries next provider on 429.

---

## Recommended Setup (Never Limit Out)

1. **AI Gateway + OpenRouter** — Set both. Gateway first, OpenRouter fallback.
   ```
   AI_GATEWAY_API_KEY=your_gateway_key
   OPENROUTER_API_KEY=your_openrouter_key
   ```

2. **Multiple keys per provider** — Create 2–3 keys per provider (separate accounts or projects). Comma-separate:
   ```
   AI_GATEWAY_API_KEY=key1,key2,key3
   ```

3. **Client keys** — Same for VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY:
   ```
   VITE_GEMINI_API_KEY=gemini_key1,gemini_key2
   ```

4. **Web search** — Serper (2500 free/mo) + Tavily (free tier) + Brave:
   ```
   SERPER_API_KEY=serper_key1,serper_key2
   TAVILY_API_KEY=tavily_key
   BRAVE_API_KEY=brave_key
   ```

---

## Free Tier Limits (Reference)

| Provider | Free Tier |
|----------|-----------|
| Google AI (Gemini) | 500–1500 req/day |
| Groq | 30 req/min |
| OpenRouter | 50 req/day (free models) |
| Serper | 2500/mo |
| Tavily | Free tier |
| Brave | Credit-based |
