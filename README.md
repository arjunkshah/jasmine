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
2. Add environment variables in Project Settings → Environment Variables:
   - `VITE_GROQ_API_KEY` — [Groq](https://console.groq.com/) (at least one AI key required)
   - `VITE_GEMINI_API_KEY` — [Google AI](https://aistudio.google.com/apikey)
   - `E2B_API_KEY` — [E2B](https://e2b.dev/dashboard) (required for sandbox preview)
3. Deploy. API routes at `/api/sandbox/start`, `/api/sandbox/update` run as serverless functions (maxDuration: 60s).
4. **Verify:** After deploy, visit `https://your-app.vercel.app/api/health` — `e2bConfigured: true` means E2B is ready.

### Sandbox not starting on Vercel?

- **Set E2B_API_KEY for all environments:** Vercel → Project Settings → Environment Variables → add `E2B_API_KEY` and enable it for **Production**, **Preview**, and **Development**.
- **E2B dashboard:** At [e2b.dev/dashboard](https://e2b.dev/dashboard), ensure you have a project and the API key is active. Create a project if the dashboard prompts you.
- **Redeploy** after adding env vars — Vercel bakes them at build time for `VITE_*`; serverless functions get them at runtime.

## Features

- **Generate** — Describe your app, get a Next.js project
- **Token streaming** — See code as it’s generated
- **Sandbox preview** — Live E2B preview (starts on Generate)
- **Download as ZIP** — Full project as `jasmine-project.zip`
- **Edit** — Chat to modify the generated code
