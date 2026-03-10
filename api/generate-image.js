/**
 * Image generation — multiple providers in order, multi-key rotation on 429:
 * 1. OpenRouter (OPENROUTER_API_KEY=key1,key2)
 * 2. Vercel AI Gateway (AI_GATEWAY_API_KEY=key1,key2)
 * 3. OpenAI DALL-E 3 (OPENAI_API_KEY=key1,key2)
 * 4. Replicate Flux (REPLICATE_API_TOKEN)
 * 5. Gemini REST/SDK (GEMINI_API_KEY=key1,key2)
 * On total failure: returns placeholder URL (200) instead of 500.
 */
export const config = { maxDuration: 60 };

import { parseKeys, isRateLimited } from '../lib/api-keys.js';

const OPENROUTER_IMAGE_MODELS = [
  'google/gemini-2.5-flash-image-generation',
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
];

const GATEWAY_IMAGE_MODELS = [
  'google/gemini-2.5-flash-image-preview',
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image',
];

const GEMINI_MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-exp',
];

function extractImage(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const raw = part.inlineData?.data ?? part.inlineData?.imageBytes;
    if (raw) {
      const base64 = typeof raw === 'string' ? raw : Buffer.from(raw).toString('base64');
      return { base64, mimeType: part.inlineData?.mimeType || 'image/png' };
    }
  }
  return null;
}

/** Try OpenRouter image models (modalities: image). Tries each key on 429. */
async function tryOpenRouter(keys, text) {
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
  for (const apiKey of keyList) {
    for (const model of OPENROUTER_IMAGE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jasmine.dev',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: text }],
          modalities: ['text', 'image'],
          stream: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const ex = new Error(err?.error?.message || `HTTP ${res.status}`);
        ex.status = res.status;
        ex.body = err;
        throw ex;
      }
      const data = await res.json();
      const images = data.choices?.[0]?.message?.images;
      if (images?.length) {
        const img = images[0];
        if (img?.type === 'image_url' && img?.image_url?.url) {
          const url = img.image_url.url;
          const m = url.match(/^data:([^;]+);base64,(.+)$/);
          if (m) return { base64: m[2], mimeType: m[1] || 'image/png' };
        }
      }
    } catch (e) {
      if (!isRateLimited(e?.status, e?.message)) console.warn('[generate-image] OpenRouter', model, 'failed:', e?.message);
    }
    }
  }
  return null;
}

/** Try Vercel AI Gateway image models (modalities: text, image). */
async function tryGateway(keys, text) {
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
  for (const apiKey of keyList) {
  for (const model of GATEWAY_IMAGE_MODELS) {
    try {
      const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: text }],
          modalities: ['text', 'image'],
          stream: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const ex = new Error(err?.error?.message || `HTTP ${res.status}`);
        ex.status = res.status;
        ex.body = err;
        throw ex;
      }
      const data = await res.json();
      const images = data.choices?.[0]?.message?.images;
      if (images?.length) {
        const img = images[0];
        if (img?.type === 'image_url' && img?.image_url?.url) {
          const url = img.image_url.url;
          const m = url.match(/^data:([^;]+);base64,(.+)$/);
          if (m) return { base64: m[2], mimeType: m[1] || 'image/png' };
        }
      }
    } catch (e) {
      if (!isRateLimited(e?.status, e?.message)) console.warn('[generate-image] Gateway', model, 'failed:', e?.message);
    }
    }
  }
  return null;
}

/** Try OpenAI DALL-E 3. */
async function tryOpenAI(keys, text) {
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
  for (const apiKey of keyList) {
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: text.slice(0, 4000),
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
        quality: 'standard',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const ex = new Error(err?.error?.message || `HTTP ${res.status}`);
      ex.status = res.status;
      ex.body = err;
      throw ex;
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (b64) return { base64: b64, mimeType: 'image/png' };
  } catch (e) {
    if (!isRateLimited(e?.status, e?.message)) console.warn('[generate-image] OpenAI DALL-E 3 failed:', e?.message);
  }
  }
  return null;
}

/** Try Replicate Flux Schnell. */
async function tryReplicate(apiKey, text) {
  try {
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-schnell',
        input: { prompt: text.slice(0, 2000) },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.detail || err?.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const out = data.output;
    const imgUrl = typeof out === 'string' ? out : Array.isArray(out) ? out[0] : null;
    if (imgUrl && imgUrl.startsWith('http')) {
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) throw new Error('Failed to fetch Replicate output');
      const buf = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const contentType = imgRes.headers.get('content-type') || 'image/png';
      return { base64, mimeType: contentType.split(';')[0].trim() || 'image/png' };
    }
  } catch (e) {
    console.warn('[generate-image] Replicate Flux failed:', e?.message);
  }
  return null;
}

/** Try Gemini REST API directly (bypasses SDK). */
async function tryRestApi(apiKey, text) {
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text }] }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return extractImage(data);
    } catch (e) {
      console.warn('[generate-image] REST', model, 'failed:', e?.message);
    }
  }
  return null;
}

/** Try @google/genai SDK. */
async function trySdk(apiKey, text) {
  for (const model of GEMINI_MODELS) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: { responseModalities: ['Text', 'Image'] },
      });
      return extractImage(response);
    } catch (e) {
      console.warn('[generate-image] SDK', model, 'failed:', e?.message);
    }
  }
  return null;
}

function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const { prompt, apiKey: clientApiKey } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return sendJson(res, 400, { error: 'Missing prompt' });
  }
  const openrouterKeys = parseKeys('OPENROUTER_API_KEY');
  const gatewayKeys = parseKeys('AI_GATEWAY_API_KEY');
  const openaiKeys = parseKeys('OPENAI_API_KEY');
  const replicateKey = (process.env.REPLICATE_API_TOKEN || '').trim();
  const geminiKeys = (typeof clientApiKey === 'string' ? [clientApiKey.trim()].filter(Boolean) : [])
    .concat(parseKeys('GEMINI_API_KEY'))
    .concat(parseKeys('VITE_GEMINI_API_KEY'))
    .filter(Boolean);

  const text = prompt.trim();
  let img = null;

  if (openrouterKeys.length) img = await tryOpenRouter(openrouterKeys, text);
  if (!img && gatewayKeys.length) img = await tryGateway(gatewayKeys, text);
  if (!img && openaiKeys.length) img = await tryOpenAI(openaiKeys, text);
  if (!img && replicateKey) img = await tryReplicate(replicateKey, text);
  if (!img && geminiKeys.length) {
    for (const key of geminiKeys) {
      img = await tryRestApi(key, text);
      if (!img) img = await trySdk(key, text);
      if (img) break;
    }
  }

  if (img) {
    return sendJson(res, 200, {
      success: true,
      image: `data:${img.mimeType};base64,${img.base64}`,
    });
  }

  // No provider configured
  if (!openrouterKeys.length && !gatewayKeys.length && !openaiKeys.length && !replicateKey && !geminiKeys.length) {
    return sendJson(res, 503, {
      error: 'Add OPENROUTER_API_KEY, AI_GATEWAY_API_KEY, OPENAI_API_KEY, REPLICATE_API_TOKEN, or GEMINI_API_KEY in env.',
    });
  }

  // All providers failed — return placeholder (200) so client doesn't spam 500s
  const placeholderUrl = `https://placehold.co/800x600?text=${encodeURIComponent(text.slice(0, 40))}`;
  return sendJson(res, 200, {
    success: false,
    image: placeholderUrl,
    placeholder: true,
    error: 'Image generation failed. Using placeholder. Check API keys (OpenRouter, OpenAI, Replicate, Gemini, AI Gateway).',
  });
}
