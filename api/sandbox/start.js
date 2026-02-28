/**
 * E2B sandbox start — open-lovable approach: Vite + React
 * No build step: npm install → npm run dev. Port 5173. Hot-reload on file write.
 */
import { getBoilerplate, checkE2B } from '../lib/e2b.js';
import { sandboxConfig } from '../lib/sandbox-config.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const t0 = Date.now();
  const log = (...args) => console.log('[sandbox/start]', `+${Date.now() - t0}ms`, ...args);
  const logErr = (...args) => console.error('[sandbox/start]', `+${Date.now() - t0}ms`, ...args);
  const cfg = sandboxConfig.e2b;
  const port = cfg.vitePort ?? cfg.nextPort ?? 5173;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const theme = (body.theme === 'light' || body.theme === 'dark') ? body.theme : 'dark';
  const BOILERPLATE = getBoilerplate(theme);

  log('POST /api/sandbox/start | theme:', theme, '| port:', port);
  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }

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

    const boilerplatePaths = Object.keys(BOILERPLATE);
    log('Writing', boilerplatePaths.length, 'boilerplate files');
    for (const [path, content] of Object.entries(BOILERPLATE)) {
      await sandbox.files.write(path, content);
    }

    log('Running npm install...');
    const installResult = await sandbox.commands.run('npm install');
    if (installResult.exitCode !== 0) {
      logErr('npm install failed:', installResult.exitCode, 'stderr:', installResult.stderr?.slice(0, 500));
    } else {
      log('npm install done');
    }

    log('Starting Vite dev server on port', port, '...');
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });

    const url = `https://${sandbox.getHost(port)}`;
    log('URL:', url, '| waiting', cfg.startupDelayMs, 'ms before first poll');
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));

    for (let i = 0; i < cfg.maxPollAttempts; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s), status:', r.status);
          break;
        } else if (i % 5 === 0) {
          log('Poll', i + 1, '/', cfg.maxPollAttempts, 'status:', r.status);
        }
      } catch (fetchErr) {
        if (i % 5 === 0) log('Poll', i + 1, '/', cfg.maxPollAttempts, 'error:', fetchErr?.message || fetchErr);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    const elapsed = Date.now() - t0;
    log('Success in', elapsed, 'ms | sandboxId:', sandbox.sandboxId, '| url:', url);
    return res.status(200).json({ success: true, sandboxId: sandbox.sandboxId, url });
  } catch (e) {
    const elapsed = Date.now() - t0;
    logErr('Failed after', elapsed, 'ms:', e?.message || e?.toString?.(), e);
    const msg = e?.message || e?.toString?.() || 'Sandbox start failed';
    return res.status(500).json({ error: msg });
  }
}
