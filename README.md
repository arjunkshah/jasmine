# Jasmine

AI-powered Next.js project generator. Describe your app, get a full project with streaming preview.

## Local development

```bash
npm install
npm run dev:all
```

Runs Vite + API server together. Open http://localhost:5173.

## Vercel deployment

1. Push to GitHub and import in [Vercel](https://vercel.com).
2. Add environment variables in Project Settings:
   - `VITE_GROQ_API_KEY` — [Groq](https://console.groq.com/)
   - `VITE_GEMINI_API_KEY` — [Google AI](https://aistudio.google.com/apikey)
   - `E2B_API_KEY` — [E2B](https://e2b.dev/dashboard) (for sandbox preview)
3. Deploy. API routes at `/api/deploy`, `/api/sandbox/start`, `/api/sandbox/update` run as serverless functions.

## Features

- **Generate** — Describe your app, get a Next.js project
- **Token streaming** — See code as it’s generated
- **Sandbox preview** — Live E2B preview (starts on Generate)
- **Download as ZIP** — Full project as `jasmine-project.zip`
- **Edit** — Chat to modify the generated code
