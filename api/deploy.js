/**
 * Deploy: E2B sandbox (target=e2b or default) or Netlify (target=netlify).
 * E2B: creates sandbox, writes files, npm install, vite dev.
 * Netlify: builds in E2B, deploys dist to Netlify.
 */
import { getBoilerplate, checkE2B } from '../lib/sandbox/e2b.js';
import { sandboxConfig } from '../lib/sandbox/sandbox-config.js';
import { parseBody } from '../lib/parse-body.js';
import { fixUnterminatedStringsInContent } from '../src/lib/fix-unterminated.js';
import JSZip from 'jszip';

export const config = { maxDuration: 120 };

const NETLIFY_API = 'https://api.netlify.com/api/v1';
const MAX_ZIP_BYTES = 50 * 1024 * 1024; // 50MB — Netlify has limits; large zips can cause 400

export default async function handler(req, res) {
  const t0 = Date.now();
  const log = (...args) => console.log('[deploy]', `+${Date.now() - t0}ms`, ...args);
  const logErr = (...args) => console.error('[deploy]', `+${Date.now() - t0}ms`, ...args);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Compressed');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    logErr('Parse body failed:', e?.message);
    return res.status(400).json({ error: 'Invalid request body. ' + (e?.message || 'Check payload size and format.') });
  }
  const { target, sandboxId, files } = body;

  if (target === 'netlify') {
    return handleNetlify(req, res, body, log, logErr);
  }

  const cfg = sandboxConfig.e2b;
  const port = cfg.vitePort ?? cfg.nextPort ?? 5173;

  log('POST /api/deploy invoked (E2B)');
  const err = checkE2B();
  if (err) {
    logErr('E2B not configured:', err.error);
    return res.status(500).json(err);
  }
  if (!process.env.E2B_TEMPLATE_ID) {
    logErr('E2B_TEMPLATE_ID not set');
    return res.status(500).json({
      error: 'Set E2B_TEMPLATE_ID=jasmine-vite. Run: npm run e2b:build, then add to Vercel env vars.',
    });
  }

  if (!files || typeof files !== 'object') {
    logErr('Bad request: missing files');
    return res.status(400).json({ error: 'Missing files object' });
  }
  log('File count:', Object.keys(files).length);

  try {
    log('Importing E2B SDK...');
    const e2b = await import('e2b/dist/index.mjs');
    const { Sandbox } = e2b;
    log('Creating sandbox (base, timeoutMs:', cfg.timeoutMs, ')...');
    const sandbox = await Sandbox.create('base', {
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: cfg.timeoutMs,
    });
    log('Sandbox created:', sandbox.sandboxId);
    log('Writing files...');
    for (const [filePath, content] of Object.entries(files)) {
      const raw = typeof content === 'string' ? content : String(content);
      await sandbox.files.write(filePath, fixUnterminatedStringsInContent(raw));
    }
    if (!files['package.json']) {
      const BOILERPLATE = getBoilerplate('dark');
      await sandbox.files.write('package.json', BOILERPLATE['package.json']);
    }
    log('Running npm install...');
    const installResult = await sandbox.commands.run('npm install');
    if (installResult.exitCode !== 0) {
      logErr('npm install failed:', installResult.exitCode, installResult.stderr?.slice(0, 500));
      return res.status(500).json({ error: 'Build failed. Check logs.' });
    }
    log('Starting Vite on port', port, '...');
    await sandbox.commands.run(`npx vite --host --port ${port}`, { background: true });
    const url = `https://${sandbox.getHost(port)}`;
    log('Waiting', cfg.startupDelayMs, 'ms before poll...');
    await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
    for (let i = 0; i < Math.min(20, cfg.maxPollAttempts); i++) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
        if (r.ok) {
          log('Server ready after', i + 1, 'poll(s)');
          break;
        }
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 1000));
    }
    log('Success, sandboxId:', sandbox.sandboxId, 'url:', url);
    return res.status(200).json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url,
      message: 'Preview ready.',
    });
  } catch (e) {
    logErr('Failed:', e?.message || e?.toString?.(), e);
    return res.status(500).json({ error: e.message || 'Deploy failed' });
  }
}

function isHtmlOnlyProject(files) {
  if (!files || typeof files !== 'object') return false;
  const hasHtml = !!(files['index.html'] || files['index.htm']);
  const hasPkg = !!files['package.json'];
  if (!hasHtml) return false;
  if (!hasPkg) return true;
  try {
    const pkg = JSON.parse(files['package.json'] || '{}');
    const scripts = pkg.scripts || {};
    return !scripts.build; // No build script = HTML-only
  } catch {
    return true;
  }
}

async function handleNetlify(req, res, body, log, logErr) {
  const { sandboxId, files } = body;
  if (!sandboxId && (!files || typeof files !== 'object')) {
    return res.status(400).json({ error: 'Provide sandboxId (E2B sandbox with project) or files object' });
  }

  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    logErr('NETLIFY_AUTH_TOKEN not set');
    return res.status(500).json({
      error: 'NETLIFY_AUTH_TOKEN not set. Add it in Vercel → Environment Variables. Get token at https://app.netlify.com/user/applications#personal-access-tokens',
    });
  }

  const htmlOnly = files && isHtmlOnlyProject(files);
  let zipBuffer;

  if (htmlOnly) {
    log('HTML-only project — zipping files directly (no build)');
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('node_modules')) continue;
      zip.file(path, typeof content === 'string' ? content : String(content));
    }
    zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  } else {
    const e2bErr = checkE2B();
    if (e2bErr) {
      logErr('E2B not configured:', e2bErr.error);
      return res.status(500).json({ error: e2bErr.error });
    }
    if (!process.env.E2B_TEMPLATE_ID) {
      return res.status(500).json({
        error: 'E2B_TEMPLATE_ID required. Run: npm run e2b:build, then set in Vercel env vars.',
      });
    }

    try {
      const e2b = await import('e2b/dist/index.mjs');
      const { Sandbox } = e2b;

      let sandbox;
      if (sandboxId) {
        log('Connecting to sandbox', sandboxId);
        sandbox = await Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY });
      } else {
        log('Creating sandbox, writing files...');
        sandbox = await Sandbox.create(process.env.E2B_TEMPLATE_ID, {
          apiKey: process.env.E2B_API_KEY,
          timeoutMs: sandboxConfig.e2b.timeoutMs,
        });
        for (const [path, content] of Object.entries(files)) {
          const raw = typeof content === 'string' ? content : String(content);
          await sandbox.files.write(path, fixUnterminatedStringsInContent(raw));
        }
      }

      log('Running npm run build...');
      const buildResult = await sandbox.commands.run('npm run build', { timeoutMs: 60000 });
      if (buildResult.exitCode !== 0) {
        logErr('Build failed:', buildResult.stderr?.slice(0, 800));
        return res.status(500).json({
          error: 'Build failed. ' + (buildResult.stderr?.slice(0, 200) || 'Check project for errors.'),
        });
      }

      log('Listing dist files...');
      const listResult = await sandbox.commands.run('find /home/user/dist -type f');
      const paths = (listResult.stdout || '')
        .trim()
        .split('\n')
        .filter((p) => p && p.startsWith('/home/user/dist/'));

      if (paths.length === 0) {
        logErr('No files in dist');
        return res.status(500).json({ error: 'Build produced no output. Check project structure.' });
      }

      log('Reading', paths.length, 'files from dist...');
      const zip = new JSZip();
      for (const p of paths) {
        try {
          const content = await sandbox.files.read(p);
          const rel = p.replace(/^\/home\/user\/dist\/?/, '') || 'index.html';
          zip.file(rel, content);
        } catch (e) {
          logErr('Failed to read', p, e?.message);
        }
      }

      zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    } catch (e) {
      logErr('Failed:', e?.message, e);
      return res.status(500).json({ error: e.message || 'Deploy failed' });
    }
  }

  try {
    if (zipBuffer.length > MAX_ZIP_BYTES) {
      logErr('Zip too large:', zipBuffer.length, 'bytes');
      return res.status(400).json({
        error: `Deploy zip is too large (${Math.round(zipBuffer.length / 1024 / 1024)}MB). Netlify may reject large uploads. Try a smaller project or fewer assets.`,
      });
    }
    log('Zip size:', Math.round(zipBuffer.length / 1024), 'KB');

    log('Creating Netlify site...');
    const siteRes = await fetch(`${NETLIFY_API}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `jasmine-${Date.now()}`,
        created_via: 'jasmine',
      }),
    });
    if (!siteRes.ok) {
      const err = await siteRes.text();
      logErr('Netlify create site failed:', siteRes.status, err);
      return res.status(500).json({
        error: 'Netlify site creation failed. ' + (err?.slice(0, 150) || siteRes.statusText),
      });
    }
    const site = await siteRes.json();
    const siteId = site.id || site.site_id;

    log('Deploying to Netlify...');
    const form = new FormData();
    form.append('title', 'Jasmine deploy');
    form.append('zip', new Blob([zipBuffer], { type: 'application/zip' }), 'dist.zip');

    const deployRes = await fetch(`${NETLIFY_API}/sites/${siteId}/builds`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!deployRes.ok) {
      const err = await deployRes.text();
      logErr('Netlify deploy failed:', deployRes.status, err);
      let errMsg = err;
      try {
        const parsed = JSON.parse(err);
        errMsg = parsed.message || parsed.error || err;
      } catch (_) {}
      return res.status(500).json({
        error: 'Netlify deploy failed. ' + (String(errMsg).slice(0, 200) || deployRes.statusText) + (err.includes('too large') ? ' Try a smaller project.' : ''),
      });
    }

    const deploy = await deployRes.json();
    const url = site.ssl_url || site.url || `https://${site.subdomain}.netlify.app`;

    log('Deploy ok url=', url);
    return res.status(200).json({
      success: true,
      url,
      siteId,
      deployId: deploy?.id,
    });
  } catch (e) {
    logErr('Failed:', e?.message, e);
    return res.status(500).json({ error: e.message || 'Deploy failed' });
  }
}
