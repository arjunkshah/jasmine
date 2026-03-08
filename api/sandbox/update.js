/**
 * E2B sandbox update — open-lovable approach: Vite + React
 * Write files → npm install (if package.json changed) → restart Vite. No build step.
 * @see https://github.com/firecrawl/open-lovable (useLegacyPeerDeps, package fixes)
 */
import { getBoilerplate, checkE2B } from '../../lib/sandbox/e2b.js';
import { sandboxConfig } from '../../lib/sandbox/sandbox-config.js';
import { parseBody } from '../../lib/parse-body.js';
import { applyPackageFixes } from '../../src/lib/package-fixes.js';
import { fixUnterminatedStringsInContent } from '../../src/lib/fix-unterminated.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const t0 = Date.now();
  const log = (...args) => console.log('[sandbox/update]', `+${Date.now() - t0}ms`, ...args);
  const logErr = (...args) => console.error('[sandbox/update]', `+${Date.now() - t0}ms`, ...args);
  const cfg = sandboxConfig.e2b;
  const port = cfg.vitePort ?? cfg.nextPort ?? 5173;
  const useCustomTemplate = !!process.env.E2B_TEMPLATE_ID;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Compressed');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = await parseBody(req);
  const { sandboxId, files } = body;
  const fileCount = files ? Object.keys(files).length : 0;
  log('POST /api/sandbox/update | sandboxId:', sandboxId, '| fileCount:', fileCount);

  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }

  if (!sandboxId || !files || typeof files !== 'object') {
    logErr('Bad request: sandboxId=', sandboxId, 'files=', !!files);
    return res.status(400).json({ error: 'Missing sandboxId or files' });
  }

  // Fix Phosphor + Lucide (open-lovable style: prevent "does not provide an export named X")
  try {
    applyPackageFixes(files);
  } catch (fixErr) {
    logErr('applyPackageFixes failed:', fixErr?.message || fixErr);
    // Continue without fixes — generated code may still work
  }

  // Ensure package.json has all deps from imports (AI often uses react-intersection-observer, framer-motion, etc.)
  const pkgRaw = files['package.json'];
  if (pkgRaw && typeof pkgRaw === 'string') {
    try {
      const pkg = JSON.parse(pkgRaw);
      const deps = pkg.dependencies || {};
      const knownVersions = {
        'vite': '^4.3.9',
        '@vitejs/plugin-react': '^4.0.0',
        'react-router-dom': '^6.20.0',
        '@phosphor-icons/react': '^2.1.6',
        'react-intersection-observer': '^9.5.3',
        'framer-motion': '^11.0.0',
        'clsx': '^2.1.0',
        'tailwind-merge': '^2.2.0',
        'recharts': '^2.12.0',
        'date-fns': '^3.0.0',
        'react-hot-toast': '^2.4.1',
        'sonner': '^1.4.0',
        'vaul': '^0.9.0',
        '@radix-ui/react-dialog': '^1.0.5',
        '@radix-ui/react-dropdown-menu': '^2.0.6',
        '@radix-ui/react-tabs': '^1.0.4',
        '@radix-ui/react-tooltip': '^1.0.7',
        'class-variance-authority': '^0.7.0',
      };
      const re = /(?:from|import)\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      const skip = new Set(['react', 'react-dom']);
      const toAdd = {};
      for (const content of Object.values(files)) {
        if (typeof content !== 'string') continue;
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(content)) !== null) {
          const raw = (m[1] || m[2] || '').trim();
          if (!raw || skip.has(raw) || raw.startsWith('.') || raw.startsWith('/') || raw.startsWith('@/') || raw.startsWith('~')) continue;
          const name = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
          if (name && !deps[name]) toAdd[name] = knownVersions[name] ?? '*';
        }
      }
      let changed = false;
      for (const [name, version] of Object.entries(toAdd)) {
        deps[name] = version;
        changed = true;
      }
      if (changed) {
        pkg.dependencies = deps;
        files['package.json'] = JSON.stringify(pkg, null, 2);
        log('Patched package.json with missing deps');
      }
    } catch (_) {}
  }

  try {
    log('Importing E2B SDK...');
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    let sandbox;
    try {
      log('Connecting to sandbox:', sandboxId);
      sandbox = await Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY });
      log('Connected');
    } catch (e) {
      const msg = e?.message || e?.toString?.() || '';
      if (msg.includes('not found') || msg.includes('404') || msg.includes('does not exist')) {
        logErr('Sandbox not found:', sandboxId);
        return res.status(404).json({ error: 'Sandbox not found. It may have expired. Start a new preview.' });
      }
      logErr('Connect failed:', msg);
      throw e;
    }

    log('Writing', fileCount, 'files...');
    for (const [path, content] of Object.entries(files)) {
      const raw = typeof content === 'string' ? content : String(content);
      const fixed = fixUnterminatedStringsInContent(raw);
      await sandbox.files.write(path, fixed);
    }

    if (!files['package.json']) {
      log('No package.json in payload, writing default');
      const BOILERPLATE = getBoilerplate('dark');
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }

    if (useCustomTemplate) {
      // Custom template has base deps pre-installed. Run npm install to add any new deps from generated code.
      log('Custom template: running npm install for new deps...');
      const installResult = await sandbox.commands.run('npm install --prefer-offline --no-audit --legacy-peer-deps', { timeoutMs: 90000 });
      if (installResult.exitCode !== 0) {
        const stderr = (installResult.stderr || '').slice(0, 800);
        logErr('npm install failed:', installResult.exitCode, 'stderr:', stderr);
        return res.status(500).json({
          error: `npm install failed. ${stderr || 'Check Vercel logs.'} Try generating again.`,
        });
      }
      log('npm install ok → Vite hot-reload');
    } else {
      log('Running npm install...');
      const installResult = await sandbox.commands.run('npm install --prefer-offline --no-audit --legacy-peer-deps', { timeoutMs: 90000 });
      if (installResult.exitCode !== 0) {
        const stderr = (installResult.stderr || '').slice(0, 800);
        logErr('npm install failed:', installResult.exitCode, 'stderr:', stderr);
        return res.status(500).json({
          error: `npm install failed. ${stderr || 'Check Vercel logs.'} Sandbox may have expired — try generating again.`,
        });
      }
      log('Restarting Vite (kill + start)...');
      await sandbox.commands.run('pkill -f vite 2>/dev/null || true');
      await new Promise((r) => setTimeout(r, 2000));
      await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    }

    const url = `https://${sandbox.getHost(port)}`;
    const delayMs = useCustomTemplate ? 3000 : cfg.startupDelayMs;
    log('URL:', url, '| waiting', delayMs, 'ms');
    await new Promise((r) => setTimeout(r, delayMs));

    const updatePollAttempts = Math.min(20, cfg.maxPollAttempts);
    for (let i = 0; i < updatePollAttempts; i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s), status:', r.status);
          break;
        } else if (i % 5 === 0) {
          log('Poll', i + 1, '/', updatePollAttempts, 'status:', r.status);
        }
      } catch (fetchErr) {
        if (i % 5 === 0) log('Poll', i + 1, '/', updatePollAttempts, 'error:', fetchErr?.message || fetchErr);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    const elapsed = Date.now() - t0;
    log('Success in', elapsed, 'ms');
    return res.status(200).json({ success: true });
  } catch (e) {
    const elapsed = Date.now() - t0;
    logErr('Failed after', elapsed, 'ms:', e?.message || e?.toString?.(), e);
    let msg = e?.message || e?.toString?.() || 'Sandbox update failed';
    if (msg.includes('not found') || msg.includes('404') || msg.includes('expired')) {
      msg = 'Sandbox expired. Start a new preview by generating again.';
    } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
      msg = 'Sandbox update timed out. Try again or generate a smaller project.';
    }
    const isTimeout = msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('504');
    return res.status(isTimeout ? 504 : 500).json({ error: msg });
  }
}
