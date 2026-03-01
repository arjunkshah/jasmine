#!/usr/bin/env node
/**
 * Hacker News "Show HN" collector.
 * Uses public Algolia API — no auth required.
 * https://hn.algolia.com/api
 */
import { writeFileSync } from 'fs';

const HN_SEARCH = 'https://hn.algolia.com/api/v1/search_by_date';
const HN_USER = 'https://hn.algolia.com/api/v1/users';

async function fetchHN(query, tags, hitsPerPage = 100, page = 0) {
  const params = new URLSearchParams({
    query: query || '',
    tags: tags || 'show_hn',
    hitsPerPage: String(hitsPerPage),
    page: String(page),
  });
  const res = await fetch(`${HN_SEARCH}?${params}`);
  if (!res.ok) throw new Error(`HN API ${res.status}`);
  return res.json();
}

async function fetchUser(username) {
  try {
    const res = await fetch(`${HN_USER}/${username}`);
    if (!res.ok) return null;
    const u = await res.json();
    return u;
  } catch {
    return null;
  }
}

function extractEmail(about) {
  if (!about || typeof about !== 'string') return '';
  const m = about.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return m ? m[0] : '';
}

async function collect() {
  const leads = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < 20) {
    const data = await fetchHN('', 'show_hn', 100, page);
    totalPages = data.nbPages || 1;
    const hits = data.hits || [];

    for (const h of hits) {
      const author = h.author;
      if (!author) continue;
      leads.push({
        name: author,
        username: author,
        twitter: '',
        website: h.url || '',
        product: (h.title || '').replace(/^Show HN: /i, ''),
        product_url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: 'hackernews',
        email: '',
      });
    }

    console.log(`HN page ${page + 1}: ${leads.length} total`);
    page++;
    await new Promise((r) => setTimeout(r, 300));
  }

  const unique = [...new Map(leads.map((l) => [l.username, l])).values()];

  for (let i = 0; i < Math.min(unique.length, 500); i++) {
    const u = await fetchUser(unique[i].username);
    if (u?.about) {
      const email = extractEmail(u.about);
      if (email) unique[i].email = email;
    }
    if (i % 50 === 0) console.log(`Enriched ${i}/${Math.min(unique.length, 500)} users`);
    await new Promise((r) => setTimeout(r, 100));
  }

  return unique;
}

collect()
  .then((leads) => {
    const csv = toCSV(leads);
    const out = 'scripts/collect-leads/output-hn.csv';
    writeFileSync(out, csv);
    const withEmail = leads.filter((l) => l.email).length;
    console.log(`Wrote ${leads.length} leads (${withEmail} with email) to ${out}`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

function toCSV(rows) {
  const cols = ['name', 'username', 'twitter', 'website', 'product', 'product_url', 'source', 'email'];
  const header = cols.join(',');
  const body = rows.map((r) =>
    cols.map((c) => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...body].join('\n');
}
