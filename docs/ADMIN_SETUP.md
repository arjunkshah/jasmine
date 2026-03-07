# Admin Dashboard Setup

The admin dashboard provides:
- **Tasks** — CRUD for issues/tasks (you add items, the AI can pull and work on them)
- **Projects** — View all users and their projects

## Access

- **URL**: Click "admin" in the nav, or go to `/#admin`
- **Tasks**: GET `/api/tasks` is public (for AI to pull). Create/update/delete require admin key.
- **Projects**: Requires admin key.

## Environment Variables (Vercel / .env)

### Required for Tasks & Projects

1. **FIREBASE_SERVICE_ACCOUNT** — JSON string of your Firebase service account key.
   - Firebase Console → Project Settings → Service Accounts → Generate new private key
   - Copy the entire JSON and set as env var (or use `GOOGLE_APPLICATION_CREDENTIALS` pointing to the file locally)

2. **ADMIN_API_KEY** — Secret key for mutate operations (POST/PATCH/DELETE tasks, GET projects).
   - Set in dashboard → Admin key input, or as `x-admin-key` header.
   - If not set, all operations are allowed (dev mode).

## AI Integration

The AI (Cursor) can pull tasks via:

```bash
curl https://your-app.vercel.app/api/tasks
```

Or in a skill/script:

```js
const res = await fetch('https://jasmine.vercel.app/api/tasks');
const { tasks } = await res.json();
```

Tasks have: `id`, `title`, `description`, `status` (todo|in_progress|done), `priority` (low|medium|high).
