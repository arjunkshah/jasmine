/**
 * Closed access gate — validates username/password for /closed route.
 * Set JASMINE_CLOSED_USERNAME and JASMINE_CLOSED_PASSWORD in Vercel env vars.
 */
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = process.env.JASMINE_CLOSED_USERNAME || 'arjunkshah';
  const password = process.env.JASMINE_CLOSED_PASSWORD || '';

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const { username: u, password: p } = body;

  if (!u || !p) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const valid = u.trim() === username && p === password;
  if (valid) {
    return res.status(200).json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
}
