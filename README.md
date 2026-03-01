# Jasmine

[![SPONSORED BY E2B FOR STARTUPS](https://img.shields.io/badge/SPONSORED%20BY-E2B%20FOR%20STARTUPS-ff8800?style=for-the-badge)](https://e2b.dev/startups)

AI-powered React project generator. Describe your app, get a full Vite + React project with streaming preview. Uses the [open-lovable](https://github.com/firecrawl/open-lovable) E2B approach: Vite dev server, no build step, instant hot-reload.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Vercel deployment (what the world uses)

**For the live site to work, set these in Vercel → Project → Settings → Environment Variables:**

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_GROQ_API_KEY` | Yes* | [Groq](https://console.groq.com/) — at least one AI key |
| `VITE_GEMINI_API_KEY` | Yes* | [Google AI](https://aistudio.google.com/apikey) |
| `E2B_API_KEY` | Yes | [E2B](https://e2b.dev/dashboard) — sandbox preview |
| `E2B_TEMPLATE_ID` | **Yes** | `jasmine-vite` — **required** or you get "no service on port 5173" |
| `VITE_FIREBASE_*` | Optional | 6 vars for auth/projects (see FIREBASE_SETUP.md) |

**Before first deploy:** Run `npm run e2b:build` once locally (creates the jasmine-vite template in your E2B account). Then add `E2B_TEMPLATE_ID=jasmine-vite` to Vercel.

**Apply to:** Production, Preview, Development (all three).

**Redeploy** after adding env vars — Vercel does not pick up new vars on existing deployments.

**Verify:** `https://your-app.vercel.app/api/health` → `e2bConfigured: true`

### E2B sandbox (open-lovable approach)

- **Vite + React** — No build step. Port 5173.
- **Hot-reload** — File writes trigger instant preview updates.
- **Important:** The `base` template may not have Node.js. If you see "no service on port 5173", build the custom template:
  ```bash
  npm run e2b:build   # Creates jasmine-vite template with Node + Vite
  ```
  Then set `E2B_TEMPLATE_ID=jasmine-vite` in Vercel → Environment Variables.
- Config: `api/lib/sandbox-config.js` (timeout, port, poll attempts).

### Sandbox not starting on Vercel?

- **E2B_TEMPLATE_ID=jasmine-vite** — Must be set. Without it, base template has no Node → "no service on port 5173".
- **E2B_API_KEY** — Set for Production, Preview, Development.
- **Redeploy** — New env vars only apply after redeploy.
- **Vercel Pro** — Sandbox endpoints use maxDuration: 120s. Hobby plan limits to 10s; upgrade to Pro if timeouts occur.
- **Logs** — Vercel → Logs for FUNCTION_INVOCATION_FAILED or other errors.

## Firebase (auth + projects)

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Enables sign-in (Email/Password + Google) and Firestore project storage.

```bash
firebase deploy --only firestore   # or npm run firebase:deploy
```

## Features

- **Generate** — Describe your app, get a full Vite + React project
- **Token streaming** — See code as it’s generated
- **Sandbox preview** — Live E2B preview (starts on Generate)
- **Auth** — Sign in with Email or Google to save projects
- **Projects** — Save, load, delete projects in Firestore
- **Image generation** — Gemini-powered image modal
- **Download as ZIP** — Full project export
- **Edit** — Chat to modify the generated code
