/**
 * Vite plugin: handle /api routes before Vite's module resolution.
 * Runs first so /api/* is not served as modules.
 */
import 'dotenv/config';
import express from 'express';
import { checkE2B, createSandbox, connectSandbox, writeFiles } from './server/sandbox.js';

const BOILERPLATE_PACKAGE = JSON.stringify({
  name: 'jasmine-app',
  version: '0.1.0',
  private: true,
  scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
  dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
}, null, 2);

const sendJson = (res, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

export function apiPlugin() {
  const api = express.Router();
  api.use(express.json({ limit: '10mb' }));
  api.get('/health', (req, res) => {
    const err = checkE2B();
    sendJson(res, { ok: true, e2bConfigured: !err, e2bError: err?.error || null });
  });
  api.get('/ping', (req, res) => sendJson(res, { ok: true, message: 'API works' }));
  api.get('/', (req, res) => sendJson(res, { ok: true, endpoints: ['/api/sandbox/start', '/api/sandbox/update', '/api/health'] }));
  api.post('/sandbox/start', async (req, res) => {
    const err = checkE2B();
    if (err) return res.status(500).json(err);
    try {
      const { sandboxId, url } = await createSandbox();
      sendJson(res, { success: true, sandboxId, url });
    } catch (e) {
      const msg = e.message || e.toString?.() || 'Sandbox start failed';
      console.error('E2B sandbox/start:', msg, e);
      res.statusCode = 500;
      sendJson(res, { error: msg });
    }
  });
  api.post('/sandbox/update', async (req, res) => {
    const err = checkE2B();
    if (err) {
      res.statusCode = 500;
      return sendJson(res, err);
    }
    const { sandboxId, files } = req.body || {};
    if (!sandboxId || !files || typeof files !== 'object') {
      res.statusCode = 400;
      return sendJson(res, { error: 'Missing sandboxId or files' });
    }
    try {
      const sandbox = await connectSandbox(sandboxId);
      await writeFiles(sandbox, files);
      if (!files['package.json']) await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
      await sandbox.commands.run('npm install');
      sendJson(res, { success: true });
    } catch (e) {
      console.error('E2B sandbox/update:', e);
      res.statusCode = 500;
      sendJson(res, { error: e.message || 'Sandbox update failed' });
    }
  });
  api.post('/deploy', async (req, res) => {
    const err = checkE2B();
    if (err) {
      res.statusCode = 500;
      return sendJson(res, err);
    }
    const { files } = req.body || {};
    if (!files || typeof files !== 'object') {
      res.statusCode = 400;
      return sendJson(res, { error: 'Missing files object' });
    }
    try {
      const { sandbox, url } = await createSandbox({ withBoilerplate: false });
      await writeFiles(sandbox, files);
      if (!files['package.json']) await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
      await sandbox.commands.run('npm install');
      await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });
      sendJson(res, { success: true, sandboxId: sandbox.sandboxId, url, message: 'Deploying... Preview may take 1–2 minutes.' });
    } catch (e) {
      console.error('E2B deploy:', e);
      res.statusCode = 500;
      sendJson(res, { error: e.message || 'Deploy failed' });
    }
  });

  return {
    name: 'jasmine-api',
    configureServer(server) {
      server.middlewares.use('/api', api);
    },
  };
}
