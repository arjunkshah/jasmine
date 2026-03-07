/**
 * Full sandbox flow test — start + update with minimal project.
 * POST /api/test/sandbox-flow
 * Run: curl -X POST http://localhost:5173/api/test/sandbox-flow -H "Content-Type: application/json"
 */
import { checkE2B } from '../../lib/sandbox/e2b.js';
import { sandboxConfig } from '../../lib/sandbox/sandbox-config.js';
import { applyPackageFixes } from '../../src/lib/package-fixes.js';

const MINIMAL_PROJECT = {
  'package.json': JSON.stringify({
    name: 'test-app',
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
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Test</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>`,
  'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)`,
  'src/App.jsx': `export default function App() {
  return <main className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
    <h1>Sandbox flow test OK</h1>
  </main>
}`,
  'src/index.css': '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: true }
})`,
  'tailwind.config.js': `export default { content: ['./index.html', './src/**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] }`,
  'postcss.config.js': `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }`,
};

export const config = { maxDuration: 90 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const t0 = Date.now();
  const log = (...a) => console.log('[test/sandbox-flow]', `+${Date.now() - t0}ms`, ...a);
  const err = checkE2B();
  if (err) {
    return res.status(500).json({ error: err.error });
  }
  const templateId = process.env.E2B_TEMPLATE_ID;
  if (!templateId) {
    return res.status(500).json({
      error: 'E2B_TEMPLATE_ID required. Run: npm run e2b:build, then set E2B_TEMPLATE_ID in .env',
    });
  }
  const cfg = sandboxConfig.e2b;
  const port = cfg.vitePort ?? 5173;
  try {
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    log('Creating sandbox, template:', templateId);
    const sandbox = await Sandbox.create(templateId, {
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: cfg.timeoutMs,
    });
    const sandboxId = sandbox.sandboxId;
    const url = `https://${sandbox.getHost(port)}`;
    log('Sandbox created:', sandboxId?.slice(0, 12) + '...');

    const files = { ...MINIMAL_PROJECT };
    applyPackageFixes(files);
    log('Writing', Object.keys(files).length, 'files');
    for (const [path, content] of Object.entries(files)) {
      await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
    }
    log('Running npm install');
    const install = await sandbox.commands.run('npm install --legacy-peer-deps', { timeoutMs: 60000 });
    if (install.exitCode !== 0) {
      log('npm install failed:', install.stderr?.slice(0, 300));
      return res.status(500).json({ error: 'npm install failed', stderr: install.stderr?.slice(0, 500) });
    }
    log('Starting Vite');
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    await new Promise(r => setTimeout(r, cfg.startupDelayMs));
    for (let i = 0; i < cfg.maxPollAttempts; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'polls');
          return res.status(200).json({
            success: true,
            sandboxId,
            url,
            elapsed: Date.now() - t0,
            message: 'Sandbox flow test passed. Preview at ' + url,
          });
        }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    return res.status(200).json({
      success: true,
      sandboxId,
      url,
      elapsed: Date.now() - t0,
      warning: 'Server may still be starting. Check ' + url,
    });
  } catch (e) {
    log('Failed:', e?.message);
    return res.status(500).json({
      error: e?.message || 'Sandbox flow failed',
      elapsed: Date.now() - t0,
    });
  }
}
