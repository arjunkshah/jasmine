# Jasmine — Technical Interview Cheat Sheet

Quick reference for judge Q&A. Memorize the bold terms and flow.

---

## 1. What is Jasmine?

**Jasmine** is an AI-powered design tool that generates full frontend websites from natural language prompts. Unlike typical "vibe coding" tools that focus on backends, Jasmine is **design-first**: it analyzes the prompt, breaks it into sections, identifies audience/goals, designs the structure, then generates code.

**Tech stack it outputs:** Vite + React (or HTML/CSS/JS). Uses Tailwind CSS, Phosphor Icons.

---

## 2. Core Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | Vite + React 19 | Main app, designer UI, file explorer |
| **API** | Vercel Serverless | `/api/ai`, `/api/sandbox/*`, `/api/fix-errors`, etc. |
| **AI** | Groq (Kimi), Gemini, OpenAI, AI Gateway | Generation + editing |
| **Preview** | E2B Cloud Sandboxes | Live preview — no local build |
| **Auth/Storage** | Firebase (Auth + Firestore) | Sign-in, project save/load |

---

## 3. Generation Flow (Step-by-Step)

1. **User prompt** → `App.jsx` `generate()` → `api.js` `generateWithGemini` / `generateWithGroq` / `generateWithGateway`
2. **AI streams** tokens → `extractNextProject()` parses `---FILE:path---` blocks in real time
3. **fixUnterminatedStringsInContent()** repairs truncated imports/strings (e.g. `import App from './s` → `import App from './App.jsx'`)
4. **fixProjectErrors()** (optional) — second model reviews and fixes: phantom imports, Tailwind, Phosphor, JSON
5. **sandbox/update** pushes files to E2B → Vite hot-reload → instant preview

---

## 4. Key Technical Concepts

### E2B Sandbox
- **What:** Cloud-based Linux containers for running code
- **Why:** Users see a live preview without installing Node/npm locally
- **Flow:** `sandbox/start` creates sandbox, writes boilerplate → `sandbox/update` writes generated files → Vite dev server runs on port 5173 → hot-reload on file write
- **Template:** `E2B_TEMPLATE_ID=jasmine-vite` — pre-built with Node + Vite for fast startup

### Output Format (Parsing)
- AI outputs: `---FILE:src/App.jsx---` then ` ```jsx ` then code then ` ``` `
- `extractNextProject()` uses regex to parse these blocks into `{ path: content }`
- `projectToRaw()` converts back to that format for edit API

### Unterminated Literals Fix
- **Problem:** AI or truncation can produce `import X from './path` (no closing quote) → Vite build fails
- **Solution:** `fixUnterminatedStringsInContent()` in `src/lib/fix-unterminated.js` — repairs imports, JSX attributes, `style={{`, unclosed quotes
- **Where:** Client (after truncateFiles), server (sandbox/update, deploy) — belt-and-suspenders

### Compress API
- **Problem:** Vercel 4.5MB body limit — large projects hit 413
- **Solution:** `fetchApiCompressed` gzip-compresses payloads; `truncateFiles` caps files at 80KB if still over limit
- **Used by:** sandbox/update, fix-errors, deploy

---

## 5. AI Providers

| Provider | Model | Key | Use |
|----------|-------|-----|-----|
| **Gemini** | gemini-3-flash-preview | VITE_GEMINI_API_KEY | Direct Google API (default) |
| **Groq** | Kimi K2, Llama 3.3 | VITE_GROQ_API_KEY | Fast inference |
| **OpenAI** | gpt-4o | VITE_OPENAI_API_KEY | Alternative |
| **AI Gateway** | google/gemini-3-flash, kimi-k2.5, gpt-5.4 | AI_GATEWAY_API_KEY | Server-side, no client key |

---

## 6. System Prompt & Generation Rules

- **Location:** `src/systemPrompt.js`
- **Rules:** Tailwind only (no dark-*), Phosphor icons only, no phantom imports, unterminated literals = zero tolerance
- **Output order:** index.css → App.jsx → components (pages before App so imports resolve)

---

## 7. Edit Flow

1. User types in chat → `sendChatMessage()` → `editWithGemini` / `editWithGroq` / `editWithGateway`
2. Current project serialized via `projectToRaw()` → sent to AI with edit request
3. AI returns changed files in `---FILE:path---` format
4. `extractNextProject()` parses → merge with existing → `sandbox/update` applies

---

## 8. Slash Commands

Parsed from AI output: `/apply`, `/fix-errors`, `/create`, `/deploy`, etc.  
`runSlashCommands()` in App.jsx executes them (e.g. `/apply` → POST sandbox/update).

---

## 9. Environment Variables (Quick Reference)

| Var | Purpose |
|-----|---------|
| VITE_GROQ_API_KEY | Groq AI |
| VITE_GEMINI_API_KEY | Google Gemini |
| VITE_OPENAI_API_KEY | OpenAI |
| E2B_API_KEY | E2B sandbox |
| E2B_TEMPLATE_ID | jasmine-vite (required) |
| AI_GATEWAY_API_KEY | Server-side gateway |
| VITE_FIREBASE_* | Auth + Firestore |

---

## 10. Common Judge Questions

**Q: How does the preview work without a local build?**  
A: E2B sandboxes run in the cloud. We write files to the sandbox, Vite dev server hot-reloads. No `npm run build` — instant dev server.

**Q: How do you handle AI output errors?**  
A: (1) Parser fixes truncated strings. (2) Fix-errors pass: second model reviews and fixes. (3) Server-side fix before writing to sandbox.

**Q: Why design-first?**  
A: Other tools jump to code. We analyze prompt → sections → audience → design → then code. Better frontends.

**Q: What's the difference between Gemini direct vs gateway?**  
A: Direct = client calls Google API with VITE_GEMINI_API_KEY. Gateway = server proxies to AI Gateway with AI_GATEWAY_API_KEY, supports model routing (e.g. google/gemini-3-flash).

---

**Good luck!**
