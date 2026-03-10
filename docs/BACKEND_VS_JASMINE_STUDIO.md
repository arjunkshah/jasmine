# Backend Alignment: Jasmine vs Jasmine-Studio

**Status: Aligned.** Jasmine and jasmine-studio use the same backend architecture.

## Architecture (Same)

| Factor | Jasmine | Jasmine-Studio |
|--------|---------|----------------|
| **Generation** | Full code from scratch | Full code from scratch |
| **Model** | gemini-3.1-pro-preview, temp 0.7 | gemini-3.1-pro-preview, temp 0.7 |
| **Prompt** | JASMINE_SYSTEM_PROMPT (adapted for Vite) | JASMINE_SYSTEM_PROMPT |
| **Output format** | `---FILE:path---` with code blocks | `---FILE:path---` with code blocks |
| **Icons** | lucide-react | lucide (CDN) |
| **Animation** | framer-motion, react-intersection-observer | framer-motion |

Both use full generation — no block library, no shadcn. Quality depends on model + prompt.

---

## Differences (Stack-Specific)

| Factor | Jasmine | Jasmine-Studio |
|--------|---------|----------------|
| **Preview** | E2B sandbox — Vite dev server, real npm install | iframe — standalone index.html with CDNs |
| **Output target** | src/App.jsx, src/index.css, src/components/*.jsx | index.html (CDN) + package.json, vite.config, src/* |
| **Image tag** | `{{IMAGE:prompt}}` (OpenRouter) | `GENERATE_IMAGE:prompt` (Gemini 2.5 Flash Image) |
| **Boilerplate** | package.json, vite.config, tailwind, postcss pre-created | AI outputs full project from scratch |

---

## Design Logic (Identical)

- Product dissection (Materiality, Primary Interaction)
- Design dimensions (Precision vs Expression, Density vs Air, Structure vs Flow)
- Typography: extreme scale, Inter / Playfair Display / JetBrains Mono
- Color: zinc, slate, stone; opacity, blur, borders
- Anti-patterns: no purple gradients, no default shadows, varied rhythm

---

## Note on Shadcn Studio / Lovable

Those tools use block composition (700+ pre-built blocks). Jasmine and jasmine-studio do not — both generate from scratch. This doc previously conflated them.
