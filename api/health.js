/** Health check for Vercel deployment - verify E2B is configured */
import { checkE2B } from '../lib/sandbox/e2b.js';

export default function handler(req, res) {
  const err = checkE2B();
  console.log('[health] GET /api/health e2bConfigured=', !err, err ? 'error=' + err.error : '');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const payload = {
    ok: true,
    e2bConfigured: !err,
    e2bError: err?.error || null,
    hint: err ? 'Add E2B_API_KEY in Vercel → Project Settings → Environment Variables (all envs: Production, Preview, Development)' : null,
  };
  res.status(200).json(payload);
}
