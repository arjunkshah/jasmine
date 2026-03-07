# Jasmine — Project Architecture

High-level map for navigating, understanding, and reusing parts of the codebase.

## Directory Structure

```
Jasmine/
├── src/                    # Frontend (React + Vite)
│   ├── App.jsx             # Main app, routing, designer UI
│   ├── main.jsx            # Entry: AuthProvider or AdminPage
│   ├── api.js              # API client + project parsing (extractNextProject, fixUnterminatedStrings, etc.)
│   ├── systemPrompt.js     # AI prompts (Vite+React, HTML, edit modes)
│   ├── downloadZip.js      # ZIP export for generated projects
│   ├── index.css           # Global styles, Tailwind
│   ├── pages/              # Route-level pages
│   │   ├── LandingPage.jsx # Marketing landing
│   │   ├── BlogPage.jsx    # Blog
│   │   └── AdminPage.jsx   # Admin dashboard (standalone at /admin)
│   ├── FileExplorer.jsx    # File tree for generated projects
│   ├── components/         # Reusable UI
│   ├── contexts/           # React contexts (Auth)
│   └── lib/                # Frontend utilities
├── api/                    # Serverless API routes (Vercel)
│   ├── ai.js               # Unified generate + edit
│   ├── fix-errors.js       # AI-powered error fixing
│   ├── generate-image.js   # Image generation
│   ├── web-search.js       # Web search
│   ├── sandbox/start.js    # E2B sandbox creation
│   ├── sandbox/update.js   # E2B sandbox file push
│   └── ...
├── lib/                    # Server-side utilities
│   ├── chat.js             # Non-streaming AI (Gateway)
│   ├── parse-body.js       # Gzip + JSON body parsing
│   └── sandbox/            # E2B config, boilerplate
├── server/                 # Standalone Express (optional)
│   ├── index.js            # E2B API on port 3001
│   └── sandbox.js          # E2B connect, writeFiles
├── e2b-template/           # E2B template build
├── scripts/                # CLI scripts (test, collect-leads)
├── docs/                   # Documentation
├── vite-plugin-api.js      # Dev: /api routes before Vite
├── vite.config.js
├── vercel.json             # Vercel config, function timeouts
└── package.json
```

## Key Flows

### Generation (Vite + React)
1. User prompt → `src/App.jsx` `generate()` → `src/api.js` `generateWithGateway` / `generateWithGroq` / `generateWithGemini`
2. AI streams → `extractNextProject()` parses `---FILE:path---` blocks
3. `fixUnterminatedStringsInContent()` repairs truncated imports
4. `fixProjectErrors()` (optional) → `/api/fix-errors`
5. `sandbox/update` pushes files to E2B → Vite hot-reload

### Edit
1. User message → `sendChatMessage()` → `editWith*` in `api.js`
2. Merged files → `sandbox/update`

### Slash Commands
Parsed from AI output in `runSlashCommands()`: `/apply`, `/fix-errors`, `/create-and-apply`, etc. Each handler in `App.jsx` calls the relevant API.

## Reusable Parts

| Part | Location | Use case |
|------|----------|----------|
| Project parsing | `src/api.js` (`extractNextProject`, `projectToRaw`) | Parse AI output, serialize for API |
| System prompts | `src/systemPrompt.js` | Customize AI behavior |
| E2B sandbox | `lib/sandbox/`, `api/sandbox/` | Swap E2B for another preview provider |
| Package fixes | `src/lib/package-fixes.js` | Phosphor icon mapping, Tailwind fixes |
| Compress API | `src/lib/compress-api.js` | Gzip-compressed fetch for large payloads |

## Dependencies

- **api/fix-errors.js** imports `../src/api.js` (projectToRaw, extractNextProject) — server uses frontend module
- **vite-plugin-api.js** uses `server/sandbox.js`, `lib/sandbox/` for E2B

## Config

- `vercel.json` — function timeouts, rewrites
- `lib/sandbox/sandbox-config.js` — E2B port, startup delay, poll attempts
- `.env` / Vercel env — `E2B_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_GEMINI_API_KEY`, etc.
