/**
 * Vite plugin: handle /api routes before Vite's module resolution.
 * open-lovable E2B approach: Vite + React, port 5173, no build step.
 */
import 'dotenv/config';
import express from 'express';
import { gunzipSync } from 'node:zlib';
import { checkE2B, createSandbox, connectSandbox, writeFiles } from './server/sandbox.js';
import { getBoilerplate } from './lib/sandbox/e2b.js';
import { sandboxConfig } from './lib/sandbox/sandbox-config.js';

const cfg = sandboxConfig.e2b;
const port = cfg.vitePort ?? cfg.nextPort ?? 5173;
const BOILERPLATE_PACKAGE = getBoilerplate('dark')['package.json'];

const sendJson = (res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

/** Body parser: handle JSON or gzip-compressed JSON (X-Compressed: gzip). */
async function bodyParser(req, res, next) {
  if (req.headers['x-compressed'] === 'gzip') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    try {
      req.body = JSON.parse(gunzipSync(Buffer.concat(chunks)).toString('utf8'));
    } catch (e) {
      return res.status(400).json({ error: 'Invalid compressed body' });
    }
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
}

export function apiPlugin() {
  const api = express.Router();
  api.use(bodyParser);
  api.get('/health', (req, res) => {
    const err = checkE2B();
    sendJson(res, { ok: true, e2bConfigured: !err, e2bError: err?.error || null });
  });
  api.get('/ping', (req, res) => sendJson(res, { ok: true, message: 'API works' }));
  api.get('/', (req, res) => sendJson(res, { ok: true, endpoints: ['/api/sandbox/start', '/api/sandbox/update', '/api/ai', '/api/generate-image', '/api/web-search', '/api/github/push', '/api/health', '/api/deploy', '/api/tasks', '/api/admin/projects'] }));
  api.all('/tasks', async (req, res) => {
    const h = (await import('./api/tasks.js')).default;
    return h(req, res);
  });
  api.get('/admin/projects', async (req, res) => {
    const h = (await import('./api/admin/projects.js')).default;
    return h(req, res);
  });
  api.post('/ai', async (req, res) => {
    return (await import('./api/ai.js')).default(req, res);
  });
  api.post('/decide-search', async (req, res) => {
    return (await import('./api/decide-search.js')).default(req, res);
  });
  api.post('/fix-errors', async (req, res) => {
    return (await import('./api/fix-errors.js')).default(req, res);
  });
  api.post('/generate-image', async (req, res) => {
    return (await import('./api/generate-image.js')).default(req, res);
  });
  api.post('/web-search', async (req, res) => {
    return (await import('./api/web-search.js')).default(req, res);
  });
  api.post('/github/push', async (req, res) => {
    return (await import('./api/github/push.js')).default(req, res);
  });
  api.post('/sandbox/start', async (req, res) => {
    const theme = (req.body?.theme === 'light' || req.body?.theme === 'dark') ? req.body.theme : 'dark';
    console.log('[api] POST /api/sandbox/start theme=', theme);
    const err = checkE2B();
    if (err) {
      console.warn('[api] E2B not configured:', err.error);
      return res.status(500).json(err);
    }
    try {
      const { sandboxId, url } = await createSandbox({ theme });
      console.log('[api] sandbox/start ok sandboxId=', sandboxId, 'url=', url);
      sendJson(res, { success: true, sandboxId, url });
    } catch (e) {
      const msg = e.message || e.toString?.() || 'Sandbox start failed';
      console.error('[api] sandbox/start failed:', msg, e);
      res.statusCode = 500;
      sendJson(res, { error: msg });
    }
  });
  api.post('/sandbox/update', async (req, res) => {
    const { sandboxId, files } = req.body || {};
    const fileCount = files ? Object.keys(files).length : 0;
    console.log('[api] POST /api/sandbox/update sandboxId=', sandboxId, 'fileCount=', fileCount);
    const err = checkE2B();
    if (err) {
      console.warn('[api] E2B not configured:', err.error);
      res.statusCode = 500;
      return sendJson(res, err);
    }
    if (!sandboxId || !files || typeof files !== 'object') {
      console.warn('[api] Bad request: sandboxId=', !!sandboxId, 'files=', !!files);
      res.statusCode = 400;
      return sendJson(res, { error: 'Missing sandboxId or files' });
    }
    try {
      const sandbox = await connectSandbox(sandboxId);
      console.log('[api] Connected, writing', fileCount, 'files...');
      await writeFiles(sandbox, files);
      if (!files['package.json']) await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
      if (process.env.E2B_TEMPLATE_ID) {
        console.log('[api] Custom template: files written → hot-reload');
      } else {
        await sandbox.commands.run('npm install');
        await sandbox.commands.run('pkill -f vite 2>/dev/null || true');
        await new Promise((r) => setTimeout(r, 1500));
        await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
        await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
      }
      console.log('[api] sandbox/update ok');
      sendJson(res, { success: true });
    } catch (e) {
      console.error('[api] sandbox/update failed:', e?.message, e);
      res.statusCode = 500;
      sendJson(res, { error: e.message || 'Sandbox update failed' });
    }
  });
  api.post('/deploy', async (req, res) => {
    return (await import('./api/deploy.js')).default(req, res);
  });
  api.post('/share-invite', async (req, res) => {
    return (await import('./api/share-invite.js')).default(req, res);
  });

  return {
    name: 'jasmine-api',
    configureServer(server) {
      server.middlewares.use('/api', api);
    },
  };
}
