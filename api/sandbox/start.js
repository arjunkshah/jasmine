import { BOILERPLATE, checkE2B } from '../lib/e2b.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const log = (...args) => console.log('[sandbox/start]', ...args);
  const logErr = (...args) => console.error('[sandbox/start]', ...args);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  log('POST /api/sandbox/start invoked');
  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }

  try {
    log('Importing E2B SDK...');
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    log('Creating sandbox (base template)...');
    const sandbox = await Sandbox.create('base', { apiKey: process.env.E2B_API_KEY });
    log('Sandbox created:', sandbox.sandboxId);
    for (const [path, content] of Object.entries(BOILERPLATE)) {
      await sandbox.files.write(path, content);
    }
    log('Wrote boilerplate files, running npm install...');
    await sandbox.commands.run('npm install');
    log('npm install done, starting Next.js dev server (background)...');
    await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });
    const url = `https://${sandbox.getHost(3000)}`;
    log('Waiting for port 3000 to be ready, url:', url);
    for (let i = 0; i < 45; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          log('Port 3000 ready after', i + 1, 'attempt(s)');
          break;
        }
      } catch (fetchErr) {
        if (i % 5 === 0) log('Poll attempt', i + 1, '/ 45:', fetchErr?.message || fetchErr);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    log('Success, returning sandboxId:', sandbox.sandboxId);
    return res.status(200).json({ success: true, sandboxId: sandbox.sandboxId, url });
  } catch (e) {
    logErr('Failed:', e?.message || e?.toString?.(), e);
    const msg = e?.message || e?.toString?.() || 'Sandbox start failed';
    return res.status(500).json({ error: msg });
  }
}
