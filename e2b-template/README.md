# E2B Next.js Template for Jasmine

Per [E2B docs](https://e2b.dev/docs/template/examples/nextjs): a custom template with Next.js 14, Tailwind, and `@phosphor-icons/react` pre-installed. The dev server starts automatically.

**Benefits:**
- Faster sandbox creation (no `npm install` or `next build` on each start)
- Fewer 504s (no long build step)
- `sandbox.files.write()` → hot-reload → users see changes instantly

## One-time setup

```bash
# Build the template (requires E2B_API_KEY in .env)
npm run e2b:build
```

Then add `E2B_TEMPLATE_ID=jasmine-nextjs` to:
- **Local:** `.env`
- **Vercel:** Project → Settings → Environment Variables

After that, sandboxes use the custom template. Code applies via `files.write()` and hot-reloads automatically.
