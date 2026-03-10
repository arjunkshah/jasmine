/**
 * Non-streaming chat for decideSearchQuery, fixProjectErrors, etc.
 * Proxy to Vercel AI Gateway, with OpenRouter fallback. Multi-key rotation on 429.
 */
import { parseKeys, isRateLimited } from './api-keys.js';

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODEL_MAP = {
  'gpt-5.4': 'openai/gpt-5.4',
  'gemini-3.1-pro': 'google/gemini-3.1-pro-preview',
  'gemini-3-pro': 'google/gemini-3-pro-preview',
  'gemini-3-flash': 'google/gemini-3-flash-preview',
};

function getModel(id) {
  return MODEL_MAP[id] || id;
}

async function chatOnce(url, apiKey, model, messages, options) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(url.includes('openrouter') && { 'HTTP-Referer': 'https://jasmine.dev' }),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 16384,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status;
    e.body = err;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  return data.choices?.[0]?.message?.content || null;
}

export async function chatWithGateway(modelId, messages, options = {}) {
  const gatewayKeys = parseKeys('AI_GATEWAY_API_KEY');
  const openrouterKeys = parseKeys('OPENROUTER_API_KEY');
  const providers = [
    ...gatewayKeys.map((k) => ({ url: GATEWAY_URL + '/chat/completions', key: k })),
    ...openrouterKeys.map((k) => ({ url: OPENROUTER_URL, key: k })),
  ];
  if (!providers.length) return null;

  const model = getModel(modelId || 'gemini-3-flash');

  for (let attempt = 0; attempt <= 2; attempt++) {
    for (const { url, key } of providers) {
      try {
        const text = await chatOnce(url, key, model, messages, options);
        return text;
      } catch (e) {
        if (!isRateLimited(e.status, e.body)) throw e;
        console.warn('[chat] Rate limited, trying next provider/key');
      }
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return null;
}
