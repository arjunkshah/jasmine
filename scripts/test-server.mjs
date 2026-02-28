#!/usr/bin/env node
/**
 * Test server health and E2B sandbox API.
 * Run: node scripts/test-server.mjs
 * Requires: dev server running (npm run dev)
 */
const BASE = process.env.TEST_URL || 'http://127.0.0.1:5173';
// Note: requires npm run dev (Vite with api plugin on 5173)

async function main() {
  console.log('Testing server at', BASE, '\n');

  // 1. API health
  try {
    const r = await fetch(`${BASE}/api/health`);
    const j = await r.json();
    console.log('✓ GET /api/health', r.status);
    if (!j.e2bConfigured) {
      console.log('  ⚠ E2B_API_KEY not configured');
    } else {
      console.log('  ✓ E2B configured');
    }
  } catch (e) {
    console.log('✗ GET /api/health failed:', e.message);
    console.log('  Is the server running? Start with: npm run dev');
    process.exit(1);
  }

  // 2. Sandbox start
  try {
    console.log('\nTesting POST /api/sandbox/start (may take 15–30s)...');
    const r = await fetch(`${BASE}/api/sandbox/start`, { method: 'POST' });
    const j = await r.json();
    if (j.success && j.url) {
      console.log('✓ Sandbox created:', j.sandboxId?.slice(0, 12) + '...');
      console.log('  URL:', j.url);
    } else {
      console.log('✗ Sandbox failed:', j.error || JSON.stringify(j));
      process.exit(1);
    }
  } catch (e) {
    console.log('✗ POST /api/sandbox/start failed:', e.message);
    process.exit(1);
  }

  console.log('\n✓ All tests passed');
}

main();
