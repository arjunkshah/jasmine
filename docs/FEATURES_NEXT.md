# Jasmine — Future Feature Adds

Ideas that wow hackathon judges fast (optics over ops). Keep scope demo-friendly.

## Hackathon Wow (showtime mode)
- [ ] Live co-build: split-screen sandbox where judges see the preview update as you prompt; includes a “show changes” overlay.
- [ ] “Explain this UI” narrator: auto-generates a guided tour script + TTS that highlights sections in the preview while speaking.
- [ ] Prompt-to-case-study: one click exports a PDF with hero screenshot, Lighthouse score, copy highlights, and a QR code to the live preview.
- [ ] AI QA overlay: run a 30-second audit (a11y, perf, SEO) and drop inline callouts on the preview with “apply fix” buttons.
- [ ] Persona swap: toggle founder/PM/marketer voices and morph copy + CTAs live; shows side-by-side diffs for impact.
- [ ] Multi-theme burst: quick palette picker that applies light/dark + “judges’ brand” in real time with animated transitions.
- [ ] Showtime motion preset: one-button cinematic entrance/stagger/blur for the demo only (export stays clean).
- [ ] Diff scrubber: slider to scrub between versions (before/after generations) with animated wipe.
- [ ] Ephemeral judge links: passwordless preview links that expire after the demo; “Copy sandbox URL” CTA.
- [ ] Dual-output prompt: generate the landing page and a matching cold email/LinkedIn DM in one run; display both panes.

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
