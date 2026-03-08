/**
 * Non-streaming chat for decideSearchQuery, fixProjectErrors, etc.
 * Proxy to Vercel AI Gateway.
 */
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

const MODEL_MAP = {
  'kimi-k2.5': 'moonshotai/kimi-k2.5',
  'gpt-5.4': 'openai/gpt-5.4',
  'gemini-3-flash': 'google/gemini-3-flash',
};

function getModel(id) {
  return MODEL_MAP[id] || id;
}

export async function chatWithGateway(modelId, messages, options = {}) {
  const apiKey = (process.env.AI_GATEWAY_API_KEY || '').trim();
  if (!apiKey) return null;

  const model = getModel(modelId || 'gemini-3-flash');
  const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 16384,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.choices?.[0]?.message?.content || null;
}
