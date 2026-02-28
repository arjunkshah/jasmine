# E2B Next.js Template for Jasmine

Per [E2B docs](https://e2b.dev/docs/template/examples/nextjs): a custom template with Next.js pre-installed and the dev server starting automatically.

**Benefits:**
- Faster sandbox creation (no `npm install` on each start)
- Dev server runs as soon as the sandbox is ready
- `sandbox.files.write()` → hot-reload → users see changes instantly

## One-time setup

```bash
# Build the template (requires E2B_API_KEY in .env)
npm run e2b:build

# Add to .env
E2B_TEMPLATE_ID=jasmine-nextjs
```

After that, sandboxes use the custom template. Code applies via `files.write()` and hot-reloads automatically.
