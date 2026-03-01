#!/usr/bin/env node
/**
 * Enrich leads with emails via Hunter.io API.
 * Requires: HUNTER_API_KEY in .env (free tier: 25/mo at hunter.io)
 * Reads CSV from output-merged.csv, enriches domains, writes output-enriched.csv
 */
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';

const key = process.env.HUNTER_API_KEY;

if (!key) {
  console.error('Set HUNTER_API_KEY in .env. Free tier at hunter.io');
  process.exit(1);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if ((c === ',' && !inQ) || i === line.length - 1) {
        if (i === line.length - 1 && c !== ',') cur += c;
        values.push(cur.replace(/""/g, '"'));
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur) values.push(cur.replace(/""/g, '"'));
    const row = {};
    header.forEach((h, i) => (row[h] = values[i] || ''));
    return row;
  });
}

function toCSV(rows, cols) {
  const header = cols.join(',');
  const body = rows.map((r) =>
    cols.map((c) => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...body].join('\n');
}

function domainFromUrl(url) {
  if (!url || !url.includes('.')) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

async function findEmail(domain) {
  if (!domain) return null;
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${key}&limit=1`
    );
    const data = await res.json();
    const emails = data?.data?.emails;
    return emails?.[0]?.value || null;
  } catch {
    return null;
  }
}

async function main() {
  const input = 'scripts/collect-leads/output-merged.csv';
  let csv;
  try {
    csv = readFileSync(input, 'utf8');
  } catch {
    console.error(`Run merge first. Create ${input} from ph + hn outputs.`);
    process.exit(1);
  }

  const rows = parseCSV(csv);
  const cols = Object.keys(rows[0] || {});
  if (!cols.includes('email')) cols.push('email');

  let enriched = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.email) continue;
    const domain = domainFromUrl(r.website) || domainFromUrl(r.product_url);
    if (!domain) continue;
    const email = await findEmail(domain);
    if (email) {
      r.email = email;
      enriched++;
    }
    if ((i + 1) % 10 === 0) console.log(`Enriched ${i + 1}/${rows.length} (${enriched} new emails)`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const out = 'scripts/collect-leads/output-enriched.csv';
  writeFileSync(out, toCSV(rows, cols));
  console.log(`Wrote ${rows.length} rows, ${enriched} new emails to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
