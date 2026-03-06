/**
 * E2B Sandbox API — open-lovable approach: Vite + React
 *
 * Run: npm run server (standalone) or use vite-plugin-api (dev)
 * Requires: E2B_API_KEY in .env (get key at https://e2b.dev/dashboard)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkE2B, createSandbox, connectSandbox, writeFiles } from './sandbox.js';
import { getBoilerplate } from '../lib/sandbox/e2b.js';
import { sandboxConfig } from '../lib/sandbox/sandbox-config.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.json({ ok: true, message: 'Jasmine E2B API', e2bConfigured: !!process.env.E2B_API_KEY, endpoints: ['POST /api/sandbox/start', 'POST /api/sandbox/update'] }));
app.get('/api', (req, res) => res.json({ ok: true, endpoints: ['/api/sandbox/start', '/api/sandbox/update'] }));

const cfg = sandboxConfig.e2b;
const port = cfg.vitePort ?? cfg.nextPort ?? 5173;
const BOILERPLATE_PACKAGE = getBoilerplate('dark')['package.json'];

app.post('/api/sandbox/start', async (req, res) => {
  const err = checkE2B();
  if (err) return res.status(500).json(err);
  const theme = (req.body?.theme === 'light' || req.body?.theme === 'dark') ? req.body.theme : 'dark';

  try {
    const { sandboxId, url } = await createSandbox({ theme });
    res.json({ success: true, sandboxId, url });
  } catch (e) {
    const msg = e.message || e.toString?.() || 'Sandbox start failed';
    console.error('E2B sandbox/start:', msg, e);
    res.status(500).json({ error: msg });
  }
});

app.post('/api/sandbox/update', async (req, res) => {
  const err = checkE2B();
  if (err) return res.status(500).json(err);

  const { sandboxId, files } = req.body;
  if (!sandboxId || !files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing sandboxId or files' });
  }

  try {
    const sandbox = await connectSandbox(sandboxId);
    await writeFiles(sandbox, files);

    if (!files['package.json']) {
      await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('pkill -f vite 2>/dev/null || true');
    await new Promise((r) => setTimeout(r, 1500));
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));

    res.json({ success: true });
  } catch (e) {
    console.error('E2B sandbox/update:', e);
    res.status(500).json({ error: e.message || 'Sandbox update failed' });
  }
});

app.post('/api/deploy', async (req, res) => {
  const err = checkE2B();
  if (err) return res.status(500).json(err);

  const { files } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing files object' });
  }

  try {
    const { sandbox, url } = await createSandbox({ theme: 'dark' });
    await writeFiles(sandbox, files);

    if (!files['package.json']) {
      await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('pkill -f vite 2>/dev/null || true');
    await new Promise((r) => setTimeout(r, 1500));
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));

    res.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url,
      message: 'Preview ready.',
    });
  } catch (e) {
    console.error('E2B deploy:', e);
    res.status(500).json({ error: e.message || 'Deploy failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`E2B API: http://localhost:${PORT}`);
});
