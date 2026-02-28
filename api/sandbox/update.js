import { BOILERPLATE, checkE2B } from '../lib/e2b.js';
import { sandboxConfig } from '../lib/sandbox-config.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const t0 = Date.now();
  const log = (...args) => console.log('[sandbox/update]', `+${Date.now() - t0}ms`, ...args);
  const logErr = (...args) => console.error('[sandbox/update]', `+${Date.now() - t0}ms`, ...args);
  const cfg = sandboxConfig.e2b;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sandboxId, files } = req.body || {};
  const fileCount = files ? Object.keys(files).length : 0;
  const filePaths = files ? Object.keys(files).slice(0, 10) : [];
  log('POST /api/sandbox/update | sandboxId:', sandboxId, '| fileCount:', fileCount, '| files:', filePaths.join(', '), fileCount > 10 ? '...' : '');

  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }

  if (!sandboxId || !files || typeof files !== 'object') {
    logErr('Bad request: sandboxId=', sandboxId, 'files=', !!files);
    return res.status(400).json({ error: 'Missing sandboxId or files' });
  }

  try {
    log('Importing E2B SDK...');
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    let sandbox;
    try {
      log('Connecting to sandbox:', sandboxId);
      sandbox = await Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY });
      log('Connected');
    } catch (e) {
      const msg = e?.message || e?.toString?.() || '';
      if (msg.includes('not found') || msg.includes('404') || msg.includes('does not exist')) {
        logErr('Sandbox not found:', sandboxId);
        return res.status(404).json({ error: 'Sandbox not found. It may have expired. Start a new preview.' });
      }
      logErr('Connect failed:', msg);
      throw e;
    }
    log('Writing', fileCount, 'files...');
    for (const [path, content] of Object.entries(files)) {
      await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
    }
    if (!files['package.json']) {
      log('No package.json in payload, writing default');
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }
    log('Running npm install...');
    const installResult = await sandbox.commands.run('npm install');
    if (installResult.exitCode !== 0) {
      logErr('npm install failed:', installResult.exitCode, 'stderr:', installResult.stderr?.slice(0, 500));
    } else {
      log('npm install done');
    }
    log('Stopping existing next, running npx next build...');
    await sandbox.commands.run('pkill -f "next" 2>/dev/null || true');
    const buildResult = await sandbox.commands.run('npx next build');
    if (buildResult.exitCode !== 0) {
      logErr('next build failed:', buildResult.exitCode, 'stderr:', buildResult.stderr?.slice(0, 800));
      return res.status(500).json({ error: 'Build failed. Check sandbox logs.' });
    }
    log('Build done, starting next on port', cfg.nextPort, '...');
    await sandbox.commands.run(`npx next start --port ${cfg.nextPort} --hostname 0.0.0.0`, { background: true });
    const url = `https://${sandbox.getHost(cfg.nextPort)}`;
    log('URL:', url, '| waiting', cfg.startupDelayMs, 'ms');
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
    const updatePollAttempts = Math.min(20, cfg.maxPollAttempts);
    for (let i = 0; i < updatePollAttempts; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s), status:', r.status);
          break;
        } else if (i % 5 === 0) {
          log('Poll', i + 1, '/', updatePollAttempts, 'status:', r.status);
        }
      } catch (fetchErr) {
        if (i % 5 === 0) log('Poll', i + 1, '/', updatePollAttempts, 'error:', fetchErr?.message || fetchErr);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    const elapsed = Date.now() - t0;
    log('Success in', elapsed, 'ms');
    return res.status(200).json({ success: true });
  } catch (e) {
    const elapsed = Date.now() - t0;
    logErr('Failed after', elapsed, 'ms:', e?.message || e?.toString?.(), e);
    const msg = e?.message || e?.toString?.() || 'Sandbox update failed';
    const isTimeout = msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('504');
    return res.status(isTimeout ? 504 : 500).json({ error: msg });
  }
}
