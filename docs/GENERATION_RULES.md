# Generation Rules & Error Prevention

This document describes the rules enforced to produce runnable, error-free Vite + React projects.

## Model Configuration

- **Groq:** `moonshotai/kimi-k2-instruct-0905` (Kimi K2 0905 — improved coding, frontend, tool use)
- **Gemini:** `gemini-3-flash-preview`
- **Temperature:** 0.5 (lower = fewer hallucinations, more deterministic code)

## Critical Error Categories

### 1. Phantom Imports (File Not Found)

- Every `import X from "./path"` must have a corresponding `---FILE:path---` output.
- Output order: pages/components BEFORE App.jsx.
- Path casing matters: `./pages/Home` ≠ `./pages/home`.

### 2. Unterminated Literals

- All strings must close: `"hello"` not `"hello`.
- Template literals: matching backticks and `${}`.
- JSX tags: every `<div>` needs `</div>`.
- Brackets: `{`, `[`, `(` must have matching `}`, `]`, `)`.
- Inline styles: `style={{ color: 'red' }}` — both `}}` required.

### 3. Tailwind & CSS

- **Allowed:** zinc, slate, gray, neutral, stone, red, amber, emerald, blue, indigo, violet, purple, pink, orange, yellow, green, teal, cyan, sky.
- **Banned:** `dark-950`, `dark-900` — use `zinc-950`, `slate-900`.
- No invalid classes: `flex-col-center` → `flex flex-col items-center`.
- index.css: only `@tailwind base/components/utilities` + plain CSS.

### 4. Phosphor Icons

- `import { CheckIcon, StarIcon } from '@phosphor-icons/react'`
- Never `import { Icon }`.

### 5. package.json

- Must include `react-router-dom` and `@phosphor-icons/react`.
- Valid JSON: no trailing commas.
- `ensurePackageDependencies()` patches missing deps client- and server-side.

## Post-Generation Fix Pass

After generation, the **other** model (Gemini if Groq was used, Groq if Gemini was used) runs a fix pass that:

1. Fixes unterminated literals
2. Adds missing package.json dependencies
3. Resolves phantom imports (create file or remove import)
4. Fixes Tailwind/Phosphor errors
5. Validates JSON
6. Improves responsive layout

## Validation Checklist (Model-Side)

Before output, the model is instructed to verify:

1. Import audit — every import has a file
2. Output order — pages before App.jsx
3. Syntax audit — no unterminated literals
4. Tailwind audit — no dark-* colors
5. ErrorBoundary — every Route wrapped
6. Icons — Phosphor only
7. Exports — every component exported
8. package.json — valid, complete
9. File completeness — no truncated output
10. Typography — not Inter
