#!/usr/bin/env node
/**
 * Comprehensive API test script — run from terminal.
 * Usage: node scripts/test-api.mjs [--deployed] [--diagnose|--sandbox|--fix-errors|--all]
 *
 * Targets:
 *   --deployed  Use deployed URL (DEPLOY_URL or https://jasmine.vercel.app)
 *   Default     Use TEST_URL or http://127.0.0.1:5173 (local)
 *
 * Examples:
 *   npm run test:api:deployed          # Test deployed (quick: diagnose + health)
 *   npm run test:api:deployed -- --all  # Full suite against deployed
 *   TEST_URL=https://jasmine.vercel.app node scripts/test-api.mjs --diagnose
 */
const useDeployed = process.argv.includes('--deployed');
const args = process.argv.slice(2).filter((a) => a !== '--deployed');
const DEPLOY_URL = process.env.DEPLOY_URL || 'https://jasmine.vercel.app';
const BASE = useDeployed ? (process.env.TEST_URL || DEPLOY_URL) : (process.env.TEST_URL || 'http://127.0.0.1:5173');
const args = process.argv.slice(2);
const runAll = args.includes('--all');
const runQuick = args.length === 0 || args.includes('--quick');
const runDiagnose = runAll || runQuick || args.includes('--diagnose');
const runSandbox = runAll || args.includes('--sandbox');
const runSandboxFlow = runAll || args.includes('--sandbox-flow');
const runFixErrors = runAll || args.includes('--fix-errors');

function log(msg, ...a) {
  console.log(msg, ...a);
}

async function fetchJson(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
  const text = await r.text();
  let j;
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    j = { _raw: text };
  }
  return { ok: r.ok, status: r.status, json: j };
}

async function testDiagnose() {
  log('\n--- GET /api/test/diagnose ---');
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/test/diagnose`);
    if (!ok) {
      log('✗ diagnose failed:', status, json);
      return false;
    }
    log('✓ diagnose ok');
    log('  E2B:', json.e2b?.configured ? '✓' : '✗', json.e2b?.error || '');
    log('  AI:', json.ai?.groq ? 'Groq' : '', json.ai?.gemini ? 'Gemini' : '', json.ai?.gateway ? 'Gateway' : '');
    log('  Firebase:', json.firebase ? '✓' : '✗');
    if (json.hints?.length) log('  Hints:', json.hints.join('; '));
    return true;
  } catch (e) {
    log('✗ diagnose failed:', e.message);
    return false;
  }
}

async function testHealth() {
  log('\n--- GET /api/health ---');
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/health`);
    if (!ok) {
      log('✗ health failed:', status, json);
      return false;
    }
    log('✓ health ok, E2B:', json.e2bConfigured ? 'configured' : 'not configured');
    return true;
  } catch (e) {
    log('✗ health failed:', e.message);
    return false;
  }
}

async function testSandboxStart() {
  log('\n--- POST /api/sandbox/start (may take 15–30s) ---');
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/sandbox/start`, {
      method: 'POST',
      body: JSON.stringify({ theme: 'dark' }),
    });
    if (!ok || !json.success) {
      log('✗ sandbox start failed:', status, json.error || json);
      return { ok: false, sandboxId: null };
    }
    log('✓ sandbox created:', json.sandboxId?.slice(0, 12) + '...', '|', json.url);
    return { ok: true, sandboxId: json.sandboxId, url: json.url };
  } catch (e) {
    log('✗ sandbox start failed:', e.message);
    return { ok: false, sandboxId: null };
  }
}

async function testSandboxUpdate(sandboxId) {
  if (!sandboxId) return false;
  log('\n--- POST /api/sandbox/update ---');
  const minimalFiles = {
    'package.json': JSON.stringify({
      name: 'test-update',
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: { dev: 'vite --host', build: 'vite build', preview: 'vite preview' },
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^4.3.9',
        tailwindcss: '^3.3.0',
        postcss: '^8.4.31',
        autoprefixer: '^10.4.16',
      },
    }, null, 2),
    'index.html': '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Test</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
    'src/main.jsx': "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\nReactDOM.createRoot(document.getElementById('root')).render(<App />)",
    'src/App.jsx': 'export default function App() { return <main class="min-h-screen flex items-center justify-center bg-zinc-900 text-white"><h1>Update test OK</h1></main> }',
    'src/index.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
    'vite.config.js': "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 5173 } })",
    'tailwind.config.js': "export default { content: ['./index.html', './src/**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] }",
    'postcss.config.js': "export default { plugins: { tailwindcss: {}, autoprefixer: {} } }",
  };
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/sandbox/update`, {
      method: 'POST',
      body: JSON.stringify({ sandboxId, files: minimalFiles }),
    });
    if (!ok || !json.success) {
      log('✗ sandbox update failed:', status, json.error || json);
      return false;
    }
    log('✓ sandbox update ok');
    return true;
  } catch (e) {
    log('✗ sandbox update failed:', e.message);
    return false;
  }
}

async function testSandboxFlow() {
  log('\n--- POST /api/test/sandbox-flow (full flow, may take 30–60s) ---');
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/test/sandbox-flow`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!ok || !json.success) {
      log('✗ sandbox-flow failed:', status, json.error || json);
      return false;
    }
    log('✓ sandbox-flow ok:', json.url, '| elapsed:', json.elapsed, 'ms');
    return true;
  } catch (e) {
    log('✗ sandbox-flow failed:', e.message);
    return false;
  }
}

async function testFixErrors() {
  log('\n--- POST /api/fix-errors (minimal project with intentional error) ---');
  const badProject = {
    sandboxId: 'test-sandbox-placeholder',
    files: {
      'package.json': JSON.stringify({
        name: 'fix-test',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: { dev: 'vite --host', build: 'vite build' },
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: { '@vitejs/plugin-react': '^4.0.0', vite: '^4.3.9', tailwindcss: '^3.3.0', postcss: '^8.4.31', autoprefixer: '^10.4.16' },
      }, null, 2),
      'index.html': '<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Fix Test</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>',
      'src/main.jsx': "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nReactDOM.createRoot(document.getElementById('root')).render(<App />)",
      'src/App.jsx': 'export default function App() { return <div>Broken import from \'./Missing\'</div> }',
      'vite.config.js': "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })",
      'tailwind.config.js': "export default { content: ['./index.html', './src/**/*.{js,jsx}'] }",
      'postcss.config.js': "export default { plugins: { tailwindcss: {}, autoprefixer: {} } }",
    },
    errors: ['Cannot find module \'./Missing\''],
  };
  try {
    const { ok, status, json } = await fetchJson(`${BASE}/api/fix-errors`, {
      method: 'POST',
      body: JSON.stringify(badProject),
    });
    if (!ok) {
      log('✗ fix-errors failed:', status, json.error || json);
      return false;
    }
    log('✓ fix-errors returned (sandboxId required for real fix):', json.fixed ? 'fixed files' : 'no sandbox');
    return true;
  } catch (e) {
    log('✗ fix-errors failed:', e.message);
    return false;
  }
}

async function main() {
  log('Testing API at', BASE, useDeployed ? '(deployed)' : '(local)');

  let passed = 0;
  let failed = 0;

  if (runDiagnose) {
    if (await testDiagnose()) passed++; else failed++;
  }
  if (await testHealth()) passed++; else failed++;

  if (runSandboxFlow) {
    if (await testSandboxFlow()) passed++; else failed++;
  } else if (runSandbox) {
    const start = await testSandboxStart();
    if (start.ok) {
      passed++;
      if (await testSandboxUpdate(start.sandboxId)) passed++; else failed++;
    } else {
      failed++;
    }
  }

  if (runFixErrors) {
    if (await testFixErrors()) passed++; else failed++;
  }

  log('\n--- Summary ---');
  log('Passed:', passed, '| Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}

main();
