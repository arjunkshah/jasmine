/**
 * Gemini image generation — tries multiple models in order.
 * Uses VITE_GEMINI_API_KEY (or GEMINI_API_KEY) from env.
 */
export const config = { maxDuration: 60 };

const MODELS = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation',
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

/** Send JSON response — works with both Express and raw Node (Vite Connect). */
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
  const apiKey = (typeof clientApiKey === 'string' ? clientApiKey : '').trim()
    || (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return sendJson(res, 503, {
      error: 'GEMINI_API_KEY or VITE_GEMINI_API_KEY required. Add in Vercel → Settings → Environment Variables.',
    });
  }

  const text = prompt.trim();
  let lastError = null;

  for (const model of MODELS) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          responseModalities: ['Text', 'Image'],
        },
      });

      const img = extractImage(response);
      if (img) {
        return sendJson(res, 200, {
          success: true,
          image: `data:${img.mimeType};base64,${img.base64}`,
        });
      }
    } catch (e) {
      lastError = e;
      console.warn('[generate-image]', model, 'failed:', e?.message);
    }
  }

  console.error('[generate-image]', lastError?.message, lastError);
  return sendJson(res, 500, {
    error: lastError?.message || 'Image generation failed. Ensure VITE_GEMINI_API_KEY has image generation access.',
  });
}
