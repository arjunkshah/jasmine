/**
 * Unified AI endpoint: handles both /api/generate and /api/edit.
 * Proxy to Vercel AI Gateway. Use mode: 'generate' | 'edit' in body.
 */
export const config = { maxDuration: 120 };

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

const MODEL_MAP = {
  'kimi-k2.5': 'moonshotai/kimi-k2.5',
  'gpt-5.4': 'openai/gpt-5.4',
  'gemini-3-flash': 'google/gemini-3-flash',
};

function getModel(modelId) {
  return MODEL_MAP[modelId] || modelId;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.AI_GATEWAY_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI_GATEWAY_API_KEY required. Add in Vercel → Settings → Environment Variables.',
    });
  }

  const { prompt, model: modelId, systemPrompt, contextFiles, searchContext } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const model = getModel(modelId || 'gemini-3-flash');

  let userContent = prompt;
  if (contextFiles?.length) {
    const blocks = contextFiles.map((f) => `---FILE:${f.name}---\n${typeof f.content === 'string' ? f.content : ''}`).join('\n\n');
    userContent += `\n\nADDITIONAL CONTEXT (user-uploaded files):\n\n${blocks}\n\n`;
  }
  if (searchContext?.length) {
    const block = searchContext.map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet || ''}`).join('\n\n');
    userContent += `\n\nWEB SEARCH CONTEXT:\n\n${block}\n\n`;
  }

  const messages = [
    { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
    { role: 'user', content: userContent },
  ];

  try {
    const response = await fetch(`${GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.5,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `AI Gateway error: ${response.status}`,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n');
          if (typeof res.flush === 'function') res.flush();
        }
      }
    }
    if (buffer) res.write(buffer + '\n');
    res.end();
  } catch (e) {
    console.error('[api/ai]', e?.message);
    res.status(500).json({ error: e?.message || 'AI request failed' });
  }
}
