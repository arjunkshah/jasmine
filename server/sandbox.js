/**
 * E2B Sandbox module — follows https://e2b.dev/docs
 *
 * - Running your first Sandbox: https://e2b.dev/docs/quickstart
 * - Sandbox lifecycle: https://e2b.dev/docs/sandbox
 * - Read & write files: https://e2b.dev/docs/filesystem/read-write
 * - Running commands: https://e2b.dev/docs/commands
 * - Connect to sandbox: https://e2b.dev/docs/sandbox/connect
 * - Next.js template: https://e2b.dev/docs/template/examples/nextjs
 *
 * Requires: E2B_API_KEY in .env (get key at https://e2b.dev/dashboard)
 *
 * Optional: Build custom template for faster sandbox + hot-reload:
 *   npx tsx e2b-template/build.mts
 *   Then set E2B_TEMPLATE_ID=jasmine-nextjs in .env
 */
import 'dotenv/config';
import { Sandbox } from 'e2b';
import { sandboxConfig } from '../api/lib/sandbox-config.js';

const E2B_API_KEY = process.env.E2B_API_KEY;
const E2B_TEMPLATE_ID = process.env.E2B_TEMPLATE_ID || 'base';
const cfg = sandboxConfig.e2b;

const BOILERPLATE = {
  'package.json': JSON.stringify({
    name: 'jasmine-app',
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0', '@phosphor-icons/react': '^2.1.6', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
  }, null, 2),
  'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`,
  'src/app/page.tsx': `export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
          <span className="text-2xl">✦</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-zinc-100">Building your project</h1>
        <p className="text-sm text-zinc-500 mt-2">Jasmine is crafting your site. Preview will update when ready.</p>
      </div>
    </main>
  );
}
`,
  'src/app/layout.tsx': `import './globals.css';
export const metadata = { title: 'Jasmine App' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  'tailwind.config.ts': `import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: {} }, plugins: [] };
export default config;
`,
  'postcss.config.mjs': `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`,
};

export function checkE2B() {
  if (!E2B_API_KEY) {
    return {
      error: 'E2B_API_KEY not set. Add E2B_API_KEY=your_key to .env. Get key at https://e2b.dev/dashboard',
    };
  }
  return null;
}

/**
 * Create a new sandbox.
 * Uses E2B_TEMPLATE_ID if set (e.g. jasmine-nextjs after building template).
 * Falls back to 'base' template (writes boilerplate, runs npm install, starts dev server).
 *
 * Per docs: Sandbox.create(template, opts)
 *
 * @param {Object} opts
 * @param {number} [opts.timeoutMs] - Sandbox timeout (default 5 min)
 * @param {boolean} [opts.withBoilerplate=true] - For 'base' only: write boilerplate and start dev server
 */
export async function createSandbox(opts = {}) {
  const log = (...args) => console.log('[sandbox]', ...args);
  const err = checkE2B();
  if (err) throw new Error(err.error);

  const useCustomTemplate = E2B_TEMPLATE_ID !== 'base';
  log('Creating sandbox template=', E2B_TEMPLATE_ID, 'timeoutMs=', opts.timeoutMs ?? cfg.timeoutMs);
  const sandbox = await Sandbox.create(E2B_TEMPLATE_ID, {
    apiKey: E2B_API_KEY,
    timeoutMs: opts.timeoutMs ?? cfg.timeoutMs,
  });
  log('Sandbox created:', sandbox.sandboxId);

  const withBoilerplate = !useCustomTemplate && opts.withBoilerplate !== false;

  if (withBoilerplate) {
    log('Writing boilerplate, npm install, next build...');
    for (const [path, content] of Object.entries(BOILERPLATE)) {
      await sandbox.files.write(path, content);
    }
    await sandbox.commands.run('npm install');
    const buildResult = await sandbox.commands.run('npx next build');
    if (buildResult.exitCode !== 0) {
      console.error('[sandbox] next build failed:', buildResult.stderr?.slice(0, 500));
      throw new Error('Build failed');
    }
    log('Starting next on port', cfg.nextPort);
    await sandbox.commands.run(`npx next start --port ${cfg.nextPort} --hostname 0.0.0.0`, { background: true });
    const url = `https://${sandbox.getHost(cfg.nextPort)}`;
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
    for (let i = 0; i < cfg.maxPollAttempts; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s)');
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const url = `https://${sandbox.getHost(cfg.nextPort)}`;
  log('createSandbox done url=', url);
  return { sandbox, sandboxId: sandbox.sandboxId, url };
}

/**
 * Connect to an existing sandbox by ID.
 * Per docs: Sandbox.connect(sandboxId, opts)
 */
export async function connectSandbox(sandboxId) {
  const err = checkE2B();
  if (err) throw new Error(err.error);
  console.log('[sandbox] Connecting to', sandboxId);
  return Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY });
}

/**
 * Write files to a sandbox.
 * Per docs: sandbox.files.write(path, content) or files.write([{ path, data }, ...])
 */
export async function writeFiles(sandbox, files) {
  const paths = Object.keys(files);
  console.log('[sandbox] writeFiles', paths.length, 'files:', paths.slice(0, 5).join(', '), paths.length > 5 ? '...' : '');
  for (const [path, content] of Object.entries(files)) {
    await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
  }
}
