# Jasmine

AI-powered Next.js project generator. Describe your app, get a full project with streaming preview.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Vercel deployment

1. Push to GitHub and import in [Vercel](https://vercel.com).
2. Add environment variables in Project Settings → Environment Variables:
   - `VITE_GROQ_API_KEY` — [Groq](https://console.groq.com/) (at least one AI key required)
   - `VITE_GEMINI_API_KEY` — [Google AI](https://aistudio.google.com/apikey)
   - `E2B_API_KEY` — [E2B](https://e2b.dev/dashboard) (required for sandbox preview)
   - `VITE_FIREBASE_*` — All 6 Firebase config vars (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
3. Deploy. API routes: `/api/sandbox/start`, `/api/sandbox/update`, `/api/deploy`, `/api/generate-image`.
4. **Verify:** Visit `https://your-app.vercel.app/api/health` — `e2bConfigured: true` means E2B is ready.

### E2B sandbox (per [e2b.dev/docs](https://e2b.dev/docs))

- **Sandbox lifecycle:** [e2b.dev/docs/sandbox](https://e2b.dev/docs/sandbox)
- **Connect to sandbox:** [e2b.dev/docs/sandbox/connect](https://e2b.dev/docs/sandbox/connect)
- **Filesystem:** [e2b.dev/docs/filesystem/read-write](https://e2b.dev/docs/filesystem/read-write)
- Uses `base` template, `next build` + `next start`, `getHost(port)` for preview URL.
- Config: `api/lib/sandbox-config.js` (timeout, port, poll attempts).

### Sandbox not starting on Vercel?

- **Set E2B_API_KEY for all environments:** Production, Preview, Development.
- **E2B dashboard:** [e2b.dev/dashboard](https://e2b.dev/dashboard) — ensure project exists and key is active.
- **Redeploy** after adding env vars.
- **FUNCTION_INVOCATION_FAILED:** Check Vercel → Logs for the actual error.

## Firebase (auth + projects)

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Enables sign-in (Email/Password + Google) and Firestore project storage.

```bash
firebase deploy --only firestore   # or npm run firebase:deploy
```

## Features

- **Generate** — Describe your app, get a full Next.js project
- **Token streaming** — See code as it’s generated
- **Sandbox preview** — Live E2B preview (starts on Generate)
- **Auth** — Sign in with Email or Google to save projects
- **Projects** — Save, load, delete projects in Firestore
- **Image generation** — Gemini-powered image modal
- **Download as ZIP** — Full project export
- **Edit** — Chat to modify the generated code
