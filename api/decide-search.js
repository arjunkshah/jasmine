/**
 * Decide if web search is needed for a prompt. Uses AI Gateway.
 */
import { chatWithGateway } from '../lib/chat.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model: modelId } = req.body || {};
  if (!prompt?.trim()) return res.status(400).json({ error: 'Missing prompt' });

  const msg = `User wants to build: "${String(prompt).slice(0, 200)}". Do you need to search the web for current info (trends, references, examples)? Reply with exactly SEARCH:query (one short query, e.g. "2024 web design trends") or NO_SEARCH.`;

  try {
    const text = await chatWithGateway(modelId || 'gemini-3.1-pro', [{ role: 'user', content: msg }], { temperature: 0.2, max_tokens: 80 });
    if (!text) return res.json({ query: null });
    const m = String(text).trim().toUpperCase().match(/SEARCH:\s*(.+)/);
    const query = m ? m[1].trim().slice(0, 100) : null;
    return res.json({ query });
  } catch (e) {
    console.warn('[api/decide-search]', e?.message);
    return res.json({ query: null });
  }
}
