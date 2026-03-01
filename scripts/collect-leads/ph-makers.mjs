#!/usr/bin/env node
/**
 * Product Hunt makers collector.
 * Requires: PRODUCT_HUNT_TOKEN in .env (get from https://www.producthunt.com/v2/oauth/applications)
 * PH API: https://api.producthunt.com/v2/docs
 * Note: PH restricts commercial use — contact hello@producthunt.com for approval.
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';

const PH_API = 'https://api.producthunt.com/v2/api/graphql';
const token = process.env.PRODUCT_HUNT_TOKEN;

if (!token) {
  console.error('Set PRODUCT_HUNT_TOKEN in .env. Get one at https://www.producthunt.com/v2/oauth/applications');
  process.exit(1);
}

const query = `
  query($cursor: String) {
    posts(first: 50, after: $cursor, order: RANKING) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          name
          tagline
          url
          makers {
            id
            name
            username
            twitterUsername
            websiteUrl
            profileImage
          }
        }
      }
    }
  }
`;

async function fetchPage(cursor = null) {
  const res = await fetch(PH_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables: cursor ? { cursor } : {},
    }),
  });
  if (!res.ok) throw new Error(`PH API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function collect() {
  const leads = new Map();
  let cursor = null;
  let page = 0;

  while (true) {
    const data = await fetchPage(cursor);
    const posts = data?.data?.posts;
    if (!posts) throw new Error('Invalid PH response');

    for (const edge of posts.edges || []) {
      const node = edge?.node;
      if (!node?.makers) continue;
      for (const m of node.makers) {
        const key = m.username || m.id;
        if (!key || leads.has(key)) continue;
        leads.set(key, {
          name: m.name || '',
          username: m.username || '',
          twitter: m.twitterUsername ? `https://x.com/${m.twitterUsername}` : '',
          website: m.websiteUrl || '',
          product: node.name || '',
          product_url: node.url || '',
          source: 'producthunt',
        });
      }
    }

    page++;
    console.log(`PH page ${page}: ${leads.size} makers so far`);

    if (!posts.pageInfo?.hasNextPage) break;
    cursor = posts.pageInfo.endCursor;
    await new Promise((r) => setTimeout(r, 500));
  }

  return Array.from(leads.values());
}

collect()
  .then((leads) => {
    const csv = toCSV(leads);
    const out = 'scripts/collect-leads/output-ph.csv';
    writeFileSync(out, csv);
    console.log(`Wrote ${leads.length} leads to ${out}`);
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
