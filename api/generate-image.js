/**
 * Image generation — Vercel AI Gateway (preferred) or Gemini REST/SDK.
 * AI Gateway: google/gemini-2.5-flash-image-preview (requires AI_GATEWAY_API_KEY)
 * Fallback: Gemini (requires GEMINI_API_KEY or VITE_GEMINI_API_KEY)
 */
export const config = { maxDuration: 60 };

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

/** Try Vercel AI Gateway image models (modalities: text, image). */
async function tryGateway(apiKey, text) {
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
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
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
      console.warn('[generate-image] Gateway', model, 'failed:', e?.message);
    }
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
  const gatewayKey = (process.env.AI_GATEWAY_API_KEY || '').trim();
  const geminiKey = (typeof clientApiKey === 'string' ? clientApiKey : '').trim()
    || (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  const text = prompt.trim();
  let img = null;

  if (gatewayKey) {
    img = await tryGateway(gatewayKey, text);
  }
  if (!img && geminiKey) {
    img = await tryRestApi(geminiKey, text);
    if (!img) img = await trySdk(geminiKey, text);
  }

  if (!img && !gatewayKey && !geminiKey) {
    return sendJson(res, 503, {
      error: 'AI_GATEWAY_API_KEY or GEMINI_API_KEY required. Add in Vercel → Settings → Environment Variables.',
    });
  }

  if (img) {
    return sendJson(res, 200, {
      success: true,
      image: `data:${img.mimeType};base64,${img.base64}`,
    });
  }

  return sendJson(res, 500, {
    error: 'Image generation failed. With AI Gateway: ensure AI_GATEWAY_API_KEY is valid. With Gemini: ensure your key has image generation access (Google AI Studio).',
  });
}
