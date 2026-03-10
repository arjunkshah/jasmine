/**
 * Unified AI endpoint: handles both /api/generate and /api/edit.
 * Proxy to Vercel AI Gateway, with OpenRouter fallback. Multi-key rotation on 429.
 * Keys: AI_GATEWAY_API_KEY=key1,key2 or OPENROUTER_API_KEY=key1,key2
 */
export const config = { maxDuration: 120 };

import { parseKeys, isRateLimited } from '../lib/api-keys.js';

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODEL_MAP = {
  'gpt-5.4': 'openai/gpt-5.4',
  'gemini-3.1-pro': 'google/gemini-3.1-pro-preview',
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
};

function getModel(modelId) {
  return MODEL_MAP[modelId] || modelId;
}

async function fetchStream(url, apiKey, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(url.includes('openrouter') && { 'HTTP-Referer': 'https://jasmine.dev' }),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status;
    e.body = err;
    throw e;
  }
  return res;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gatewayKeys = parseKeys('AI_GATEWAY_API_KEY');
  const openrouterKeys = parseKeys('OPENROUTER_API_KEY');
  if (!gatewayKeys.length && !openrouterKeys.length) {
    return res.status(503).json({
      error: 'AI_GATEWAY_API_KEY or OPENROUTER_API_KEY required. Add in Vercel → Settings → Environment Variables. For multi-key: AI_GATEWAY_API_KEY=key1,key2,key3',
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

  const body = { model, messages, stream: true, temperature: 0.7, max_tokens: 16384 };

  const providers = [
    ...gatewayKeys.map((k) => ({ type: 'gateway', key: k })),
    ...openrouterKeys.map((k) => ({ type: 'openrouter', key: k })),
  ];

  let response = null;
  let lastError = null;

  outer: for (let attempt = 0; attempt <= 2; attempt++) {
    for (const { type, key } of providers) {
      try {
        const url = type === 'gateway' ? `${GATEWAY_URL}/chat/completions` : OPENROUTER_URL;
        response = await fetchStream(url, key, body);
        break outer;
      } catch (e) {
        lastError = e;
        if (!isRateLimited(e.status, e.body)) {
          console.error('[api/ai]', e?.message);
          return res.status(e.status || 500).json({ error: e?.message || 'AI request failed' });
        }
        console.warn('[api/ai] Rate limited, trying next provider/key');
      }
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }

  if (!response) {
    return res.status(503).json({
      error: lastError?.message || 'All AI providers rate limited. Add more keys: AI_GATEWAY_API_KEY=key1,key2 or OPENROUTER_API_KEY=key1,key2',
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
}
