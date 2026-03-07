# Jasmine — Feature List

## Core Generation

| Feature | Description |
|---------|-------------|
| **Prompt-to-project** | Describe your app in plain English. Jasmine generates a full project with structure, sections, and polish. |
| **Token streaming** | See code as it's generated in real time. |
| **Vite + React mode** | Full Vite + React project with Tailwind, TypeScript, and production-ready structure. |
| **HTML mode** | Plain HTML, CSS, and JavaScript. Multiple files (index.html, styles.css, script.js). No build step, no sandbox — instant preview in the browser. |
| **Prebuilt prompts** | One-click presets: Law firm, SaaS, Restaurant, Agency, Gaming, Wellness. |
| **Context files** | Attach .txt, .md, .json, .ts, .tsx, .js, .css, .html, .yaml for AI context. |

## Edit & Refine

| Feature | Description |
|---------|-------------|
| **Chat-native edits** | Ask for tweaks like "make the hero tighter" or "add pricing". Jasmine updates the project instantly. |
| **Streaming edits** | See edit results stream in as the AI applies changes. |
| **Targeted edits** | AI modifies only the files needed — no full regeneration. |
| **Auto error fixing** | Post-generation error review and fix (React mode). |

## Preview & Deploy

| Feature | Description |
|---------|-------------|
| **Live sandbox preview** | E2B sandbox runs Vite dev server. Hot-reload as you generate and edit. |
| **HTML instant preview** | HTML mode previews in iframe — no sandbox needed. |
| **Download as ZIP** | Export full project for local development. |
| **Deploy to Netlify** | One-click deploy from the canvas. |
| **Open preview** | Launch preview in new tab. |

## Auth & Projects

| Feature | Description |
|---------|-------------|
| **Sign in** | Email/password or Google. |
| **Project storage** | Save, load, and delete projects in Firestore. |
| **Project sidebar** | Browse projects, spin up sandbox, load into designer. |

## AI & Tools

| Feature | Description |
|---------|-------------|
| **Multi-model** | Groq, Gemini, or AI Gateway (Kimi K2.5, GPT 5.4). |
| **Web search** | AI can search the web for context when generating. |
| **Image generation** | Gemini-powered image modal. `{{IMAGE:prompt}}` in code gets auto-replaced. |
| **Slash commands** | `/deploy`, `/download`, `/fix-errors`, `/netlify-deploy`, `/web-search`, `/generate-image`, etc. |

## Output Quality

| Feature | Description |
|---------|-------------|
| **Tailwind CSS** | All styling via Tailwind. No inline styles or CSS-in-JS. |
| **Phosphor icons** | Consistent icon set. |
| **Semantic HTML** | Proper landmarks, headings, accessibility. |
| **Responsive** | Mobile-first, breakpoints, no hardcoded widths. |
| **Production-ready** | Sensible structure, no placeholders, shippable code. |

## UX

| Feature | Description |
|---------|-------------|
| **Dark / light theme** | Toggle theme. Persists in localStorage. |
| **Split view** | Chat + Files/Preview side by side. Resizable panels. |
| **File explorer** | Browse generated files. Click to view. |
| **Blog** | Design playbook, SEO guides, conversion frameworks. |
