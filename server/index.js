/**
 * E2B Sandbox API — deploys generated Next.js projects to E2B sandbox
 *
 * Follows E2B documentation: https://e2b.dev/docs
 *
 * Run: npm run dev:all (starts both server + Vite) or npm run server
 * Requires: E2B_API_KEY in .env (get key at https://e2b.dev/dashboard)
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkE2B, createSandbox, connectSandbox, writeFiles } from './sandbox.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => res.json({ ok: true, message: 'Jasmine E2B API', e2bConfigured: !!process.env.E2B_API_KEY, endpoints: ['POST /api/sandbox/start', 'POST /api/sandbox/update'] }));
app.get('/api', (req, res) => res.json({ ok: true, endpoints: ['/api/sandbox/start', '/api/sandbox/update'] }));

const BOILERPLATE_PACKAGE = JSON.stringify({
  name: 'jasmine-app',
  version: '0.1.0',
  private: true,
  scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
  dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
}, null, 2);

/**
 * POST /api/sandbox/start
 * Start sandbox with boilerplate — per E2B docs quickstart
 */
app.post('/api/sandbox/start', async (req, res) => {
  const err = checkE2B();
  if (err) return res.status(500).json(err);

  try {
    const { sandboxId, url } = await createSandbox();
    res.json({ success: true, sandboxId, url });
  } catch (e) {
    const msg = e.message || e.toString?.() || 'Sandbox start failed';
    console.error('E2B sandbox/start:', msg, e);
    res.status(500).json({ error: msg });
  }
});

/**
 * POST /api/sandbox/update
 * Update files in existing sandbox — per E2B docs filesystem/read-write
 */
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

    const hasPackageJson = !!files['package.json'];
    if (!hasPackageJson) {
      await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
    }
    // Always run npm install: install new deps when package.json was written, or ensure deps are in sync
    await sandbox.commands.run('npm install');

    res.json({ success: true });
  } catch (e) {
    console.error('E2B sandbox/update:', e);
    res.status(500).json({ error: e.message || 'Sandbox update failed' });
  }
});

/**
 * POST /api/deploy
 * Legacy — full deploy (creates new sandbox, writes all files)
 */
app.post('/api/deploy', async (req, res) => {
  const err = checkE2B();
  if (err) return res.status(500).json(err);

  const { files } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing files object' });
  }

  try {
    const { sandbox, url } = await createSandbox({ withBoilerplate: false });
    await writeFiles(sandbox, files);

    if (!files['package.json']) {
      await sandbox.files.write('package.json', BOILERPLATE_PACKAGE);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });

    res.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url,
      message: 'Deploying... Preview may take 1–2 minutes.',
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
