/**
 * Vercel Sandbox provider — clean preview URLs (no port in hostname)
 * @see https://vercel.com/docs/vercel-sandbox
 * @see https://github.com/firecrawl/open-lovable (lib/sandbox/providers/vercel-provider.ts)
 *
 * Requires: VERCEL_OIDC_TOKEN (auto when deployed) or VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID
 */
import { getBoilerplate } from './e2b.js';
import { sandboxConfig } from './sandbox-config.js';

export function checkVercelSandbox() {
  const hasOidc = !!process.env.VERCEL_OIDC_TOKEN;
  const hasToken = !!(process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID);
  if (!hasOidc && !hasToken) {
    return {
      error:
        'Vercel Sandbox requires VERCEL_OIDC_TOKEN (run vercel env pull when deployed) or VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID',
    };
  }
  return null;
}

/**
 * Create Vercel sandbox with Next.js boilerplate.
 * Returns { sandboxId, url } — url is clean (e.g. https://xxx.vercel.run)
 */
export async function createVercelSandbox(opts = {}) {
  const err = checkVercelSandbox();
  if (err) throw new Error(err.error);

  const cfg = sandboxConfig.vercel;
  const theme = (opts.theme === 'light' || opts.theme === 'dark') ? opts.theme : 'dark';
  const BOILERPLATE = getBoilerplate(theme);

  const { Sandbox } = await import('@vercel/sandbox');

  const createOpts = {
    timeout: cfg.timeoutMs,
    runtime: 'node22',
    ports: [cfg.nextPort],
  };
  if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID) {
    createOpts.teamId = process.env.VERCEL_TEAM_ID;
    createOpts.projectId = process.env.VERCEL_PROJECT_ID;
    createOpts.token = process.env.VERCEL_TOKEN;
  }

  const sandbox = await Sandbox.create(createOpts);

  // Write boilerplate to /vercel/sandbox
  const basePath = '/vercel/sandbox';
  const files = Object.entries(BOILERPLATE).map(([path, content]) => ({
    path: `${basePath}/${path}`,
    content: Buffer.from(content, 'utf-8'),
  }));
  await sandbox.writeFiles(files);

  // npm install
  const install = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install'],
    cwd: basePath,
  });
  if (install.exitCode !== 0) {
    throw new Error(`npm install failed: ${install.stderr || install.stdout}`);
  }

  // next build
  const build = await sandbox.runCommand({
    cmd: 'npx',
    args: ['next', 'build'],
    cwd: basePath,
  });
  if (build.exitCode !== 0) {
    throw new Error(`next build failed: ${build.stderr || build.stdout}`);
  }

  // next start (background)
  await sandbox.runCommand({
    cmd: 'npx',
    args: ['next', 'start', '--port', String(cfg.nextPort), '--hostname', '0.0.0.0'],
    cwd: basePath,
    detached: true,
  });

  const url = sandbox.domain(cfg.nextPort);
  await new Promise((r) => setTimeout(r, cfg.startupDelayMs));

  for (let i = 0; i < cfg.maxPollAttempts; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(cfg.pollFetchTimeoutMs) });
      if (r.ok) break;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { sandboxId: sandbox.sandboxId, url, sandbox };
}

const BASE_PATH = '/vercel/sandbox';

/**
 * Update files in an existing Vercel sandbox.
 */
export async function updateVercelSandbox(sandboxId, files) {
  const err = checkVercelSandbox();
  if (err) throw new Error(err.error);

  const cfg = sandboxConfig.vercel;
  const { Sandbox } = await import('@vercel/sandbox');

  const sandbox = await Sandbox.get({ sandboxId });

  const fileEntries = Object.entries(files).map(([path, content]) => ({
    path: `${BASE_PATH}/${path}`,
    content: Buffer.from(typeof content === 'string' ? content : String(content), 'utf-8'),
  }));
  await sandbox.writeFiles(fileEntries);

  // npm install, next build, next start
  await sandbox.runCommand({
    cmd: 'sh',
    args: ['-c', 'pkill -f "next" 2>/dev/null || true'],
    cwd: '/',
  });
  await new Promise((r) => setTimeout(r, 2000));

  const install = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install'],
    cwd: BASE_PATH,
  });
  if (install.exitCode !== 0) {
    throw new Error(`npm install failed: ${install.stderr || install.stdout}`);
  }

  const build = await sandbox.runCommand({
    cmd: 'npx',
    args: ['next', 'build'],
    cwd: BASE_PATH,
  });
  if (build.exitCode !== 0) {
    throw new Error(`next build failed: ${build.stderr || build.stdout}`);
  }

  await sandbox.runCommand({
    cmd: 'npx',
    args: ['next', 'start', '--port', String(cfg.nextPort), '--hostname', '0.0.0.0'],
    cwd: BASE_PATH,
    detached: true,
  });

  await new Promise((r) => setTimeout(r, cfg.startupDelayMs));
}
