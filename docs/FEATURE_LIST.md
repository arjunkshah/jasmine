# Jasmine — Feature List

## What We Have

### Generation
- [x] **Text-to-project** — Describe an app, get a full Vite + React project
- [x] **Token streaming** — See code as it's generated in real time
- [x] **Dual AI providers** — Groq (Kimi K2) and Gemini 2.5 Flash
- [x] **Open-lovable style** — Complete files, no truncation, correct output order
- [x] **Post-generation fix pass** — Other model reviews and fixes errors (imports, Tailwind, Phosphor, etc.)
- [x] **Image placeholders** — `{{IMAGE:prompt}}` replaced with Gemini-generated images

### Preview & Sandbox
- [x] **E2B sandbox** — Live preview in cloud (no local build)
- [x] **Hot-reload** — File writes trigger instant preview updates
- [x] **Retry preview** — Re-apply code if sandbox times out
- [x] **Status bubbles** — "Installing dependencies", "Applying to preview" in chat

### Edit Flow
- [x] **Chat-based edits** — Natural language to modify generated code
- [x] **Edit summary** — AI explains what changed (not just "Done")
- [x] **Streaming edit response** — See edits as they stream

### Context & Input
- [x] **Attach files** — txt, md, json, csv, ts, tsx, js, jsx, css, html, yaml as context
- [x] **Web search** — Serper or Tavily for trends/references (SERPER_API_KEY or TAVILY_API_KEY)
- [x] **Search results in prompt** — Web results shown as expandable bubble

### Auth & Projects
- [x] **Firebase auth** — Email/password + Google sign-in
- [x] **Project sidebar** — Save, load, delete projects in Firestore
- [x] **Auto-save** — Projects saved when signed in

### Export & Deploy
- [x] **Download as ZIP** — Full project export
- [x] **Netlify deploy** — One-click deploy to Netlify

### UI/UX
- [x] **Light/dark theme** — Toggle with persistence
- [x] **Resizable panels** — Files / Chat / Preview layout
- [x] **File explorer** — Tree view, Monaco editor for code
- [x] **Landing page** — Prompt templates (SaaS, meditation app, etc.)
- [x] **Chat** — User/assistant messages, status bubbles

---

## What We Should Add

### Generation Quality
- [ ] **Higher token limits** — 32K+ output so model can emit full projects without truncation
- [ ] **Stricter validation** — Pre-flight check for phantom imports before sandbox update
- [ ] **Component library presets** — "Use shadcn" or "Use Aceternity" as one-click option
- [ ] **Template selection** — Start from blank, dashboard, landing, docs, etc.

### Edit & Iteration
- [ ] **Undo/redo** — Revert to previous project state
- [ ] **Diff view** — Side-by-side before/after for edits
- [ ] **Multi-turn edit context** — Remember last N edits in conversation
- [ ] **Inline edit** — Click a component in preview, describe change in place

### Preview & Sandbox
- [ ] **Persistent sandbox** — Keep sandbox alive between sessions (or longer timeout)
- [ ] **Mobile preview** — Toggle viewport for responsive check
- [ ] **Console logs** — Show runtime errors from preview iframe
- [ ] **Multiple preview URLs** — Vercel, Netlify, custom

### Context & Input
- [ ] **URL as context** — Paste URL, scrape content for reference
- [ ] **Figma/design import** — Use Framelink or similar for design-to-code
- [ ] **Screenshot upload** — "Build this" from image
- [ ] **More file types** — PDF, images as reference

### Auth & Projects
- [ ] **Project sharing** — Public link to view (read-only) project
- [ ] **Fork project** — Duplicate and iterate
- [ ] **Project tags/folders** — Organize saved projects
- [ ] **Export project metadata** — Prompt, model used, timestamp

### Export & Deploy
- [ ] **Vercel deploy** — One-click (in addition to Netlify)
- [x] **GitHub push** — Create repo and push code (GITHUB_TOKEN, /api/github/push)
- [ ] **Copy individual file** — One-click copy file content
- [ ] **Run locally** — "Open in VS Code" or copy `npm run dev` command

### UI/UX
- [ ] **Keyboard shortcuts** — Cmd+Enter to generate, Cmd+K for command palette
- [ ] **Onboarding** — First-time tour or tips
- [ ] **Error recovery** — Clearer messages, suggested fixes
- [ ] **Usage/limits** — Show API usage, rate limits, or credits
- [ ] **Responsive layout** — Better mobile/tablet experience

### Monetization & Growth
- [ ] **Usage tracking** — Per-user or per-session limits
- [ ] **Waitlist / signup** — Capture leads before full auth
- [x] **Analytics** — Track generations, edits, deploys (Firebase Analytics, optional `VITE_FIREBASE_MEASUREMENT_ID`)
