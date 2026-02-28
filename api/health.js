/** Health check for Vercel deployment - verify E2B is configured */
import { checkE2B } from './lib/e2b.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const err = checkE2B();
  res.status(200).json({
    ok: true,
    e2bConfigured: !err,
    e2bError: err?.error || null,
    hint: err ? 'Add E2B_API_KEY in Vercel → Project Settings → Environment Variables (all envs: Production, Preview, Development)' : null,
  });
}
