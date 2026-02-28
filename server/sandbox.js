/**
 * E2B Sandbox module — open-lovable approach: Vite + React
 * @see https://github.com/firecrawl/open-lovable
 * No build step: npm install → npm run dev. Port 5173. Hot-reload on file write.
 *
 * Requires: E2B_API_KEY in .env (get key at https://e2b.dev/dashboard)
 */
import 'dotenv/config';
import { Sandbox } from 'e2b';
import { sandboxConfig } from '../api/lib/sandbox-config.js';
import { getBoilerplate } from '../api/lib/e2b.js';

const E2B_API_KEY = process.env.E2B_API_KEY;
const cfg = sandboxConfig.e2b;
const port = cfg.vitePort ?? cfg.nextPort ?? 5173;

export function checkE2B() {
  if (!E2B_API_KEY) {
    return {
      error: 'E2B_API_KEY not set. Add E2B_API_KEY=your_key to .env. Get key at https://e2b.dev/dashboard',
    };
  }
  return null;
}

/**
 * Create a new sandbox. Writes Vite boilerplate, npm install, starts vite dev.
 */
export async function createSandbox(opts = {}) {
  const log = (...args) => console.log('[sandbox]', ...args);
  const err = checkE2B();
  if (err) throw new Error(err.error);
  if (!process.env.E2B_TEMPLATE_ID) {
    throw new Error('E2B_TEMPLATE_ID required. Run: npm run e2b:build. Then set E2B_TEMPLATE_ID=jasmine-vite in .env');
  }

  log('Creating sandbox timeoutMs=', opts.timeoutMs ?? cfg.timeoutMs);
  const sandbox = await Sandbox.create(process.env.E2B_TEMPLATE_ID, {
    apiKey: E2B_API_KEY,
    timeoutMs: opts.timeoutMs ?? cfg.timeoutMs,
  });
  log('Sandbox created:', sandbox.sandboxId);

  const theme = (opts.theme === 'light' || opts.theme === 'dark') ? opts.theme : 'dark';
  const BOILERPLATE = getBoilerplate(theme);

  log('Writing boilerplate (theme=', theme, ')...');
  for (const [path, content] of Object.entries(BOILERPLATE)) {
    await sandbox.files.write(path, content);
  }

  const url = `https://${sandbox.getHost(port)}`;
  log('Custom template: Vite already running, boilerplate written → hot-reload');
  await new Promise((r) => setTimeout(r, 5000));

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

  log('createSandbox done url=', url);
  return { sandbox, sandboxId: sandbox.sandboxId, url };
}

/**
 * Connect to an existing sandbox by ID.
 */
export async function connectSandbox(sandboxId) {
  const err = checkE2B();
  if (err) throw new Error(err.error);
  console.log('[sandbox] Connecting to', sandboxId);
  return Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY });
}

/**
 * Write files to a sandbox.
 */
export async function writeFiles(sandbox, files) {
  const paths = Object.keys(files);
  console.log('[sandbox] writeFiles', paths.length, 'files:', paths.slice(0, 5).join(', '), paths.length > 5 ? '...' : '');
  for (const [path, content] of Object.entries(files)) {
    await sandbox.files.write(path, typeof content === 'string' ? content : String(content));
  }
}
