/**
 * Web search API — Serper (primary) or Tavily.
 * Env: SERPER_API_KEY or TAVILY_API_KEY
 */
export const config = { maxDuration: 30 };

function sendJson(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

async function searchSerper(query, apiKey) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 8 }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  const organic = data.organic || [];
  return organic.map((o) => ({
    title: o.title,
    link: o.link,
    snippet: o.snippet,
  }));
}

async function searchTavily(query, apiKey) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 8,
    }),
  });
  if (!res.ok) throw new Error(`Tavily ${res.status}`);
  const data = await res.json();
  const results = data.results || [];
  return results.map((r) => ({
    title: r.title,
    link: r.url,
    snippet: r.content,
  }));
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

  const { q, query } = req.body || {};
  const searchQuery = (q || query || '').trim();
  if (!searchQuery) {
    return sendJson(res, 400, { error: 'Missing q or query' });
  }

  const serperKey = (process.env.SERPER_API_KEY || '').trim();
  const tavilyKey = (process.env.TAVILY_API_KEY || '').trim();

  if (serperKey) {
    try {
      const results = await searchSerper(searchQuery, serperKey);
      return sendJson(res, 200, { success: true, results });
    } catch (e) {
      console.warn('[web-search] Serper failed:', e?.message);
    }
  }

  if (tavilyKey) {
    try {
      const results = await searchTavily(searchQuery, tavilyKey);
      return sendJson(res, 200, { success: true, results });
    } catch (e) {
      console.warn('[web-search] Tavily failed:', e?.message);
    }
  }

  return sendJson(res, 503, {
    error: 'SERPER_API_KEY or TAVILY_API_KEY required for web search. Add in Vercel env. Serper: 2500 free/mo at serper.dev',
  });
}
