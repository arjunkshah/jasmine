# src/ — Frontend

## Entry

- **main.jsx** — Renders AuthProvider (or AdminPage if `/admin`)
- **App.jsx** — Main app: routing, designer UI, chat, preview

## pages/

- **LandingPage.jsx** — Marketing landing
- **BlogPage.jsx** — Blog
- **AdminPage.jsx** — Admin dashboard (standalone at `/admin`)

## Core modules

- **api.js** — API client (generate, edit, fix-errors), project parsing (`extractNextProject`, `projectToRaw`), `fixUnterminatedStringsInContent`
- **systemPrompt.js** — AI system prompts (Vite+React, HTML, edit)
- **downloadZip.js** — ZIP export for generated projects
- **FileExplorer.jsx** — File tree for generated projects

## components/

Reusable UI: AuthPage, BlurPopUp*, E2BBadge, StatusBubble, ProjectSidebar, ImageGeneratorModal, etc.

## contexts/

- **AuthContext.jsx** — Auth state (Firebase)

## lib/

- **analytics.js** — Firebase analytics
- **animations.js** — Framer Motion presets
- **compress-api.js** — Gzip-compressed fetch
- **firebase.js** — Firebase client init
- **package-fixes.js** — Phosphor icon mapping, Tailwind fixes
- **projects.js** — Firestore projects CRUD
