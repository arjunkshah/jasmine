# Jasmine — Codebase Structure

Quick reference for navigating and editing the project.

## Top-level layout

| Path | Purpose |
|------|---------|
| `src/` | Frontend (React + Vite) |
| `api/` | Serverless API routes (Vercel) |
| `lib/` | Server-side utilities (chat, sandbox, parse-body) |
| `server/` | Standalone Express (optional, E2B API) |
| `docs/` | Documentation |
| `scripts/` | CLI scripts (test, collect-leads) |

## Frontend (`src/`)

| Path | Purpose |
|------|---------|
| `main.jsx` | Entry: AuthProvider or AdminPage |
| `App.jsx` | Main app, routing, designer UI |
| `pages/` | Route-level pages (Landing, Blog, Admin) |
| `components/` | Reusable UI components |
| `contexts/` | React contexts (Auth) |
| `lib/` | Frontend utilities (analytics, animations, firebase, etc.) |
| `api.js` | API client, project parsing |
| `systemPrompt.js` | AI prompts |
| `downloadZip.js` | ZIP export |
| `FileExplorer.jsx` | File tree for generated projects |

## API routes (`api/`)

| File | Purpose |
|------|---------|
| `ai.js` | Unified generate + edit |
| `fix-errors.js` | AI-powered error fixing |
| `generate-image.js` | Image generation |
| `web-search.js` | Web search |
| `sandbox/start.js` | E2B sandbox creation |
| `sandbox/update.js` | E2B sandbox file push |

## See also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Flows, reusable parts, dependencies
- [src/README.md](../src/README.md) — Frontend module details
