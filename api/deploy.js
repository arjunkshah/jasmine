/**
 * Deploy project files to E2B sandbox — open-lovable approach: Vite + React
 * Creates sandbox, writes files, npm install, npm run dev. No build step.
 */
import { getBoilerplate, checkE2B } from '../lib/sandbox/e2b.js';
import { sandboxConfig } from '../lib/sandbox/sandbox-config.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const t0 = Date.now();
  const log = (...args) => console.log('[deploy]', `+${Date.now() - t0}ms`, ...args);
  const logErr = (...args) => console.error('[deploy]', `+${Date.now() - t0}ms`, ...args);
  const cfg = sandboxConfig.e2b;
  const port = cfg.vitePort ?? cfg.nextPort ?? 5173;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  log('POST /api/deploy invoked');
  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }
  if (!process.env.E2B_TEMPLATE_ID) {
    logErr('E2B_TEMPLATE_ID not set');
    return res.status(500).json({
      error: 'Set E2B_TEMPLATE_ID=jasmine-vite. Run: npm run e2b:build, then add to Vercel env vars.',
    });
  }

  const { files } = req.body || {};
  if (!files || typeof files !== 'object') {
    logErr('Bad request: missing files');
    return res.status(400).json({ error: 'Missing files object' });
  }
  log('File count:', Object.keys(files).length);

  try {
    log('Importing E2B SDK...');
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    log('Creating sandbox (base, timeoutMs:', cfg.timeoutMs, ')...');
    const sandbox = await Sandbox.create('base', {
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: cfg.timeoutMs,
    });
    log('Sandbox created:', sandbox.sandboxId);
    log('Writing files...');
    for (const [filePath, content] of Object.entries(files)) {
      await sandbox.files.write(filePath, typeof content === 'string' ? content : String(content));
    }
    if (!files['package.json']) {
      const BOILERPLATE = getBoilerplate('dark');
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }
    log('Running npm install...');
    const installResult = await sandbox.commands.run('npm install');
    if (installResult.exitCode !== 0) {
      logErr('npm install failed:', installResult.exitCode, installResult.stderr?.slice(0, 500));
      return res.status(500).json({ error: 'Build failed. Check logs.' });
    }
    log('Starting Vite on port', port, '...');
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    const url = `https://${sandbox.getHost(port)}`;
    log('Waiting', cfg.startupDelayMs, 'ms before poll...');
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
    for (let i = 0; i < Math.min(20, cfg.maxPollAttempts); i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s)');
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    log('Success, sandboxId:', sandbox.sandboxId, 'url:', url);
    return res.status(200).json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url,
      message: 'Preview ready.',
    });
  } catch (e) {
    logErr('Failed:', e?.message || e?.toString?.(), e);
    return res.status(500).json({ error: e.message || 'Deploy failed' });
  }
}
