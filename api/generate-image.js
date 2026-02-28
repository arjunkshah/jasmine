/**
 * Gemini image generation (Imagen 3 / gemini-2.0-flash-exp-image-generation)
 * Uses GEMINI_API_KEY or VITE_GEMINI_API_KEY from env.
 */
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY or VITE_GEMINI_API_KEY required' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
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

    return res.status(500).json({ error: 'No image in response' });
  } catch (e) {
    console.error('[generate-image]', e?.message, e);
    return res.status(500).json({ error: e?.message || 'Image generation failed' });
  }
}
