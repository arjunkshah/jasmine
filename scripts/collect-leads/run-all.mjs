#!/usr/bin/env node
/**
 * Run all lead collectors and merge.
 * Usage: node scripts/collect-leads/run-all.mjs
 *
 * 1. HN (no auth) — always runs
 * 2. PH (needs PRODUCT_HUNT_TOKEN) — runs if token set
 * 3. Merge — combines outputs
 * 4. Hunter enrich (needs HUNTER_API_KEY) — runs if key set
 */
import { spawn } from 'child_process';

const steps = [
  { name: 'HN Show', script: 'hn-show.mjs', required: false },
  { name: 'PH Makers', script: 'ph-makers.mjs', required: false },
  { name: 'Merge', script: 'merge.mjs', required: true },
  { name: 'Hunter Enrich', script: 'enrich-hunter.mjs', required: false },
];

async function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [`scripts/collect-leads/${script}`], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Exit ${code}`))));
  });
}

for (const step of steps) {
  console.log(`\n--- ${step.name} ---`);
  try {
    await run(step.script);
  } catch (e) {
    if (step.required) {
      console.error(e);
      process.exit(1);
    }
    console.log(`Skipped (${e.message})`);
  }
}

console.log('\nDone. Check scripts/collect-leads/output-enriched.csv (or output-merged.csv)');
