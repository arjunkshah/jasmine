/**
 * Diagnostic endpoint — check env, E2B, Firebase, keys.
 * GET /api/test/diagnose
 * Run: curl http://localhost:5173/api/test/diagnose
 */
import { checkE2B } from '../../lib/sandbox/e2b.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const e2b = checkE2B();
  const hasGroq = !!process.env.VITE_GROQ_API_KEY;
  const hasGemini = !!process.env.VITE_GEMINI_API_KEY;
  const hasGateway = !!process.env.AI_GATEWAY_API_KEY;
  const hasFirebase = !!(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID);
  const hasE2BTemplate = !!process.env.E2B_TEMPLATE_ID;
  const hasSerper = !!process.env.SERPER_API_KEY;
  const hasTavily = !!process.env.TAVILY_API_KEY;
  const hasReplicate = !!process.env.REPLICATE_API_TOKEN;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  const ok = !e2b && (hasGroq || hasGemini || hasGateway);
  res.status(200).json({
    ok,
    timestamp: new Date().toISOString(),
    e2b: {
      configured: !e2b,
      error: e2b?.error || null,
      templateId: hasE2BTemplate ? process.env.E2B_TEMPLATE_ID : null,
    },
    ai: {
      groq: hasGroq,
      gemini: hasGemini,
      gateway: hasGateway,
      openai: hasOpenAI,
    },
    firebase: hasFirebase,
    search: { serper: hasSerper, tavily: hasTavily },
    images: { replicate: hasReplicate, openai: hasOpenAI },
    hints: [
      !e2b && 'E2B_API_KEY required for preview. Run: npm run e2b:build, set E2B_TEMPLATE_ID',
      !hasGroq && !hasGemini && !hasGateway && 'Add VITE_GROQ_API_KEY or VITE_GEMINI_API_KEY or AI_GATEWAY_API_KEY',
      !hasFirebase && 'Firebase optional for project storage. Add VITE_FIREBASE_* vars',
    ].filter(Boolean),
  });
}
