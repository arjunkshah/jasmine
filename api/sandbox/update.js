import { Sandbox } from 'e2b';
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

  const { sandboxId, files } = req.body || {};
  if (!sandboxId || !files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing sandboxId or files' });
  }

  try {
    const sandbox = await Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY });
    for (const [path, content] of Object.entries(files)) {
      await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
    }
    if (!files['package.json']) {
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }
    await sandbox.commands.run('npm install');
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('E2B sandbox/update:', e);
    return res.status(500).json({ error: e.message || 'Sandbox update failed' });
  }
}
