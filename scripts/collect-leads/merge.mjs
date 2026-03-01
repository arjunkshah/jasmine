#!/usr/bin/env node
/**
 * Merge PH and HN CSV outputs into one deduplicated CSV.
 * Run after ph-makers.mjs and hn-show.mjs.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { header: [], rows: [] };
  const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQ = !inQ;
      else if ((c === ',' && !inQ) || i === line.length - 1) {
        if (i === line.length - 1 && c !== ',') cur += c;
        values.push(cur.replace(/""/g, '"'));
        cur = '';
      } else cur += c;
    }
    if (cur) values.push(cur.replace(/""/g, '"'));
    const row = {};
    header.forEach((h, i) => (row[h] = values[i] || ''));
    return row;
  });
  return { header, rows };
}

function toCSV(rows, cols) {
  const header = cols.join(',');
  const body = rows.map((r) =>
    cols.map((c) => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(',')
  );
  return [header, ...body].join('\n');
}

const cols = ['name', 'username', 'twitter', 'website', 'product', 'product_url', 'source', 'email'];
const seen = new Set();
const merged = [];

for (const file of ['output-ph.csv', 'output-hn.csv']) {
  const path = `scripts/collect-leads/${file}`;
  if (!existsSync(path)) {
    console.log(`Skipping ${file} (not found)`);
    continue;
  }
  const { rows } = parseCSV(readFileSync(path, 'utf8'));
  for (const r of rows) {
    const key = (r.username || r.name || '').toLowerCase() || r.website || r.product_url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (!r.source) r.source = file.includes('ph') ? 'producthunt' : 'hackernews';
    if (!r.email) r.email = '';
    merged.push(r);
  }
  console.log(`${file}: ${rows.length} rows`);
}

const out = 'scripts/collect-leads/output-merged.csv';
writeFileSync(out, toCSV(merged, cols));
console.log(`Merged ${merged.length} unique leads to ${out}`);
