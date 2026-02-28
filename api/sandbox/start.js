import { BOILERPLATE, checkE2B } from '../lib/e2b.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const err = checkE2B();
  if (err) return res.status(500).json(err);

  try {
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    const sandbox = await Sandbox.create('base', { apiKey: process.env.E2B_API_KEY });
    for (const [path, content] of Object.entries(BOILERPLATE)) {
      await sandbox.files.write(path, content);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });
    const url = `https://${sandbox.getHost(3000)}`;
    return res.status(200).json({ success: true, sandboxId: sandbox.sandboxId, url });
  } catch (e) {
    console.error('E2B sandbox/start:', e);
    const msg = e?.message || e?.toString?.() || 'Sandbox start failed';
    return res.status(500).json({ error: msg });
  }
}
