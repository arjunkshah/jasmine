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

const E2B_API_KEY = process.env.E2B_API_KEY;
const E2B_TEMPLATE_ID = process.env.E2B_TEMPLATE_ID || 'base';

/** Default sandbox timeout: 5 minutes (per E2B docs). Max 1h Base / 24h Pro. */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

const BOILERPLATE = {
  'package.json': JSON.stringify({
    name: 'jasmine-app',
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
  }, null, 2),
  'app/page.tsx': `export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-100">
      <div className="text-center">
        <p className="text-lg opacity-80">Generating your project...</p>
        <p className="text-sm text-zinc-500 mt-2">Code will appear as it streams</p>
      </div>
    </main>
  );
}
`,
  'app/layout.tsx': `export const metadata = { title: 'Jasmine App' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
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
  const err = checkE2B();
  if (err) throw new Error(err.error);

  const useCustomTemplate = E2B_TEMPLATE_ID !== 'base';
  const sandbox = await Sandbox.create(E2B_TEMPLATE_ID, {
    apiKey: E2B_API_KEY,
    timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });

  const withBoilerplate = !useCustomTemplate && opts.withBoilerplate !== false;

  if (withBoilerplate) {
    for (const [path, content] of Object.entries(BOILERPLATE)) {
      await sandbox.files.write(path, content);
    }
    await sandbox.commands.run('npm install');
    await sandbox.commands.run('npx next dev --port 3000 --hostname 0.0.0.0', { background: true });
    const url = `https://${sandbox.getHost(3000)}`;
    // Wait for Next.js dev server to be ready (up to 45s)
    for (let i = 0; i < 45; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (r.ok) break;
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  const url = `https://${sandbox.getHost(3000)}`;
  return { sandbox, sandboxId: sandbox.sandboxId, url };
}

/**
 * Connect to an existing sandbox by ID.
 * Per docs: Sandbox.connect(sandboxId, opts)
 */
export async function connectSandbox(sandboxId) {
  const err = checkE2B();
  if (err) throw new Error(err.error);

  return Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY });
}

/**
 * Write files to a sandbox.
 * Per docs: sandbox.files.write(path, content) or files.write([{ path, data }, ...])
 */
export async function writeFiles(sandbox, files) {
  for (const [path, content] of Object.entries(files)) {
    await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
  }
}
