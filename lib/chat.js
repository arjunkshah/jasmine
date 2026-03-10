/**
 * Non-streaming chat for decideSearchQuery, fixProjectErrors, etc.
 * Proxy to Vercel AI Gateway, with OpenRouter fallback. Multi-key rotation on 429.
 */
import { parseKeys, isRateLimited } from './api-keys.js';

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const MODEL_MAP = {
  'gpt-5.4': 'gpt-5.4',
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
  const openaiKeys = parseKeys('OPENAI_API_KEY');
  const model = getModel(modelId || 'gemini-3-flash');
  const isGpt54 = model === 'gpt-5.4';

  const providers = isGpt54 && openaiKeys.length
    ? [
        ...openaiKeys.map((k) => ({ url: OPENAI_URL, key: k, model: 'gpt-5.4' })),
        ...gatewayKeys.map((k) => ({ url: GATEWAY_URL + '/chat/completions', key: k, model: 'openai/gpt-5.4' })),
        ...openrouterKeys.map((k) => ({ url: OPENROUTER_URL, key: k, model: 'openai/gpt-5.4' })),
      ]
    : [
        ...gatewayKeys.map((k) => ({ url: GATEWAY_URL + '/chat/completions', key: k, model: model })),
        ...openrouterKeys.map((k) => ({ url: OPENROUTER_URL, key: k, model: model })),
      ];
  if (!providers.length) return null;

  for (let attempt = 0; attempt <= 2; attempt++) {
    for (const { url, key, model: m } of providers) {
      try {
        const text = await chatOnce(url, key, m, messages, options);
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
