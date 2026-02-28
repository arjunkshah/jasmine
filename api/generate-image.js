/**
 * Gemini image generation — tries gemini-2.0-flash-preview-image-generation, falls back to exp
 * Uses GEMINI_API_KEY or VITE_GEMINI_API_KEY from env.
 */
export const config = { maxDuration: 60 };

const MODELS = ['gemini-2.0-flash-preview-image-generation', 'gemini-2.0-flash-exp-image-generation'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY or VITE_GEMINI_API_KEY required' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  let lastError = null;
  for (const model of MODELS) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model,
        contents: prompt.trim(),
        config: {
          responseModalities: ['Text', 'Image'],
        },
      });

      const parts = response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.status(200).json({
            success: true,
            image: `data:${mimeType};base64,${base64}`,
          });
        }
      }
    } catch (e) {
      lastError = e;
      console.warn('[generate-image]', model, 'failed:', e?.message);
    }
  }

  console.error('[generate-image]', lastError?.message, lastError);
  return res.status(500).json({
    error: lastError?.message || 'Image generation failed. Ensure GEMINI_API_KEY has image generation access.',
  });
}
