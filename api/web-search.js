/**
 * Web search API — Serper (primary), Tavily, or Brave. Multi-key rotation on 429.
 * Env: SERPER_API_KEY=key1,key2 or TAVILY_API_KEY or BRAVE_API_KEY
 */
export const config = { maxDuration: 30 };

import { parseKeys, isRateLimited } from '../lib/api-keys.js';

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
  if (!res.ok) {
    const e = new Error(`Serper ${res.status}`);
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const organic = data.organic || [];
  return organic.map((o) => ({ title: o.title, link: o.link, snippet: o.snippet }));
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
  if (!res.ok) {
    const e = new Error(`Tavily ${res.status}`);
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const results = data.results || [];
  return results.map((r) => ({ title: r.title, link: r.url, snippet: r.content }));
}

async function searchBrave(query, apiKey) {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`,
    {
      headers: { 'X-Subscription-Token': apiKey },
    }
  );
  if (!res.ok) {
    const e = new Error(`Brave ${res.status}`);
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const results = data.web?.results || [];
  return results.map((r) => ({ title: r.title, link: r.url, snippet: r.description }));
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

  const serperKeys = parseKeys('SERPER_API_KEY');
  const tavilyKeys = parseKeys('TAVILY_API_KEY');
  const braveKeys = parseKeys('BRAVE_API_KEY');

  const providers = [
    ...serperKeys.map((k) => ({ name: 'Serper', fn: searchSerper, key: k })),
    ...tavilyKeys.map((k) => ({ name: 'Tavily', fn: searchTavily, key: k })),
    ...braveKeys.map((k) => ({ name: 'Brave', fn: searchBrave, key: k })),
  ];

  for (let attempt = 0; attempt <= 2; attempt++) {
    for (const { name, fn, key } of providers) {
      try {
        const results = await fn(searchQuery, key);
        return sendJson(res, 200, { success: true, results });
      } catch (e) {
        if (!isRateLimited(e?.status, e?.message)) {
          console.warn(`[web-search] ${name} failed:`, e?.message);
        }
      }
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }

  return sendJson(res, 503, {
    error: 'SERPER_API_KEY, TAVILY_API_KEY, or BRAVE_API_KEY required. Multi-key: SERPER_API_KEY=key1,key2. Serper: 2500 free/mo at serper.dev. Brave: brave.com/search/api',
  });
}
