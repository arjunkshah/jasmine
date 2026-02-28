import { BOILERPLATE, checkE2B } from '../lib/e2b.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const log = (...args) => console.log('[sandbox/update]', ...args);
  const logErr = (...args) => console.error('[sandbox/update]', ...args);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sandboxId, files } = req.body || {};
  log('POST /api/sandbox/update invoked, sandboxId:', sandboxId, 'fileCount:', files ? Object.keys(files).length : 0);

  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }

  if (!sandboxId || !files || typeof files !== 'object') {
    logErr('Bad request: missing sandboxId or files');
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
      throw e;
    }
    log('Writing', Object.keys(files).length, 'files...');
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
      logErr('npm install non-zero exit:', installResult.exitCode, 'stderr:', installResult.stderr?.slice(0, 500));
    } else {
      log('npm install done');
    }
    log('Success');
    return res.status(200).json({ success: true });
  } catch (e) {
    logErr('Failed:', e?.message || e?.toString?.(), e);
    const msg = e?.message || e?.toString?.() || 'Sandbox update failed';
    const isTimeout = msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('504');
    return res.status(isTimeout ? 504 : 500).json({ error: msg });
  }
}
