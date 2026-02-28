# E2B Vite Template for Jasmine

Custom E2B template with Node.js 20, Vite, React, Tailwind, and `@phosphor-icons/react` pre-installed.

**Fixes:** "no service on port 5173" — the base template may not have Node.js.

**Benefits:**
- Node + Vite pre-installed
- No `npm install` on each sandbox start
- `sandbox.files.write()` → hot-reload → instant preview

## One-time setup

```bash
# Build the template (requires E2B_API_KEY in .env)
npm run e2b:build
```

Then add `E2B_TEMPLATE_ID=jasmine-vite` to:
- **Local:** `.env`
- **Vercel:** Project → Settings → Environment Variables
