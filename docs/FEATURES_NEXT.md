# Jasmine — Future Feature Adds

Ideas to layer on top of the current feature set. Grouped by impact and effort to help prioritization.

## Ship Soon (low lift)
- [ ] Blog RSS + sitemap: generate `/blog/rss.xml` and add posts to sitemap for SEO + subscriptions.
- [ ] Copy/Share for posts: “Copy link” and UTM builder on blog pages and featured cards.
- [ ] Inline keyboard shortcuts: Cmd/Ctrl+K command palette for quick “generate”, “deploy”, “open blog”, “toggle theme”.
- [ ] One-click “Run locally” helper: surface the `npm install && npm run dev` command with a copy button after ZIP download.

## Builder & Generation
- [x] **Visual editing (HTML mode)** — Edit copy, colors, move/delete elements in the preview; changes sync back to index.html.
- [ ] Palette/config import: drop in Tailwind/Design Token JSON to lock colors, radii, and typography before generation.
- [ ] Section locking: regenerate only selected sections (e.g., hero or pricing) without touching the rest of the page.
- [ ] Form scaffolder: prompt flag for validated forms (Zod/React Hook Form) plus optional Express/Firebase endpoint stubs.
- [ ] Media-aware prompts: allow image uploads/screenshots as context; map dominant colors into the generated theme.
- [ ] Component presets: toggles for shadcn/Aceternity-style components or phosphor-only icon pass with consistent stroke weight.

## Preview, Quality, Reliability
- [ ] Lighthouse + a11y scan in sandbox: run quick audits after apply and surface scoring + action items.
- [ ] Console/error surface: stream sandbox console errors and stack traces into a “Preview Logs” tab.
- [ ] Persistent sandbox option: extend TTL or auto-restart with last files for faster iteration between sessions.
- [ ] Diff-aware apply: show file diffs before applying to sandbox; allow skip/accept per file.

## Collaboration & Projects
- [x] **Share via email** — Invite collaborators by email; they must sign in to access. Requires RESEND_API_KEY.
- [ ] Shareable preview links: read-only links for stakeholders, with optional password and expiration.
- [ ] Comment pins: leave anchored comments on sections in the preview; feed them back as edit requests.
- [ ] Version snapshots: named checkpoints with rollback; export snapshot + prompt history.
- [ ] Project tags/folders and search: organize saved projects, filter by tag/model/date.

## Growth & Content
- [ ] Template/prompt library: curated starting points with thumbnails; “use this prompt” button.
- [ ] Weekly digest: email of new templates/posts plus top-performing prompts.
- [ ] Feature tour: first-session walkthrough covering build flow, preview, and edit commands.
