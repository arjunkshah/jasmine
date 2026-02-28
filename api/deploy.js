import { BOILERPLATE, checkE2B } from './lib/e2b.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const log = (...args) => console.log('[deploy]', ...args);
  const logErr = (...args) => console.error('[deploy]', ...args);

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
    log('Creating sandbox...');
    const sandbox = await Sandbox.create('base', { apiKey: process.env.E2B_API_KEY });
    for (const [filePath, content] of Object.entries(files)) {
      await sandbox.files.write(filePath, typeof content === 'string' ? content : String(content));
    }
    if (!files['package.json']) {
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });
    const previewUrl = `https://${sandbox.getHost(3000)}`;
    log('Success, sandboxId:', sandbox.sandboxId);
    return res.status(200).json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url: previewUrl,
      message: 'Deploying... Preview may take 1–2 minutes.',
    });
  } catch (e) {
    logErr('Failed:', e?.message || e?.toString?.(), e);
    return res.status(500).json({ error: e.message || 'Deploy failed' });
  }
}
