#!/usr/bin/env node
/**
 * Fetch tasks from API (for AI / terminal).
 * Usage: node scripts/fetch-tasks.mjs [--url BASE_URL]
 * Example: npm run tasks:fetch
 *          node scripts/fetch-tasks.mjs --url https://jasmine.vercel.app
 */
const BASE = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : process.env.TEST_URL || process.env.DEPLOY_URL || 'http://127.0.0.1:5173';

async function main() {
  const r = await fetch(`${BASE}/api/tasks`);
  const j = await r.json();
  if (!r.ok) {
    console.error('Error:', j.error || r.status);
    process.exit(1);
  }
  const tasks = j.tasks || [];
  if (tasks.length === 0) {
    console.log('No tasks.');
    return;
  }
  console.log(JSON.stringify(tasks, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
