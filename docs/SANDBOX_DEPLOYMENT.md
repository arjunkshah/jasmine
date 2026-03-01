# Sandbox Deployment Guide

Jasmine supports two sandbox providers for previewing generated Next.js apps. Choose based on your deployment needs.

## Architecture

| Provider | Preview URL format | Best for |
|----------|-------------------|----------|
| **E2B** (default) | `https://3000-{sandboxId}.e2b.app` | Local dev, any hosting |
| **Vercel** | Clean URL via `sandbox.domain()` | Vercel deployments |

### Why the port in E2B URLs?

E2B's infrastructure uses the port as a subdomain prefix for routing: `{port}-{sandboxId}.e2b.app`. This is how E2B's proxy directs traffic to the correct service inside the sandbox. **It cannot be changed** — it's part of E2B's design.

### Vercel Sandbox: Clean URLs

When deployed to Vercel, set `SANDBOX_PROVIDER=vercel` for preview URLs without the port prefix. Vercel Sandbox returns URLs like `https://xxx.vercel.run` directly from their API.

## Setup

### E2B (default)

```env
E2B_API_KEY=your_key
# Optional: custom template for faster starts
E2B_TEMPLATE_ID=jasmine-nextjs
```

### Vercel Sandbox (clean URLs)

When deployed to Vercel, OIDC is automatic. For local dev with Vercel:

```bash
vercel link
vercel env pull
```

This adds `VERCEL_OIDC_TOKEN` to `.env.local`.

For production without OIDC:

```env
SANDBOX_PROVIDER=vercel
VERCEL_TOKEN=your_personal_access_token
VERCEL_TEAM_ID=team_xxxx
VERCEL_PROJECT_ID=prj_xxxx
```

## References

- [open-lovable](https://github.com/firecrawl/open-lovable) — Vercel (default) and E2B providers
- [E2B docs](https://e2b.dev/docs)
- [Vercel Sandbox docs](https://vercel.com/docs/vercel-sandbox)
