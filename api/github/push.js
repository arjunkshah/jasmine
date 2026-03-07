/**
 * Push project to GitHub — create repo and push files in one commit.
 * Requires: GITHUB_TOKEN (personal access token with repo scope)
 */
export const config = { maxDuration: 60 };

const GITHUB_API = 'https://api.github.com';

const JASMINE_TOOL_PATHS = [
  /^api\//, /^server\//, /^docs\//, /^e2b-template\//, /^scripts\//, /^patches\//,
  /vite-plugin-api/, /systemPrompt/, /downloadZip\.js$/,
];

function isJasmineToolPath(path) {
  if (!path || typeof path !== 'string') return false;
  return JASMINE_TOOL_PATHS.some((re) => re.test(path));
}

function filterProjectFiles(files) {
  if (!files || typeof files !== 'object') return {};
  return Object.fromEntries(
    Object.entries(files).filter(([path]) => !isJasmineToolPath(path))
  );
}

async function ghFetch(token, path, opts = {}) {
  const url = path.startsWith('http') ? path : `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `GitHub API ${res.status}`);
  return data;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (process.env.GITHUB_TOKEN || '').trim();
  if (!token) {
    return res.status(503).json({
      error: 'GITHUB_TOKEN required. Add in Vercel → Environment Variables. Create at https://github.com/settings/tokens (repo scope).',
    });
  }

  const { files, repoName, description, isPrivate = true } = req.body || {};
  const filtered = filterProjectFiles(files);
  if (Object.keys(filtered).length === 0) {
    return res.status(400).json({ error: 'No project files to push' });
  }

  const name = (repoName || 'jasmine-project').trim().replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 100) || 'jasmine-project';

  try {
    // 1. Create repo
    const repo = await ghFetch(token, '/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: description || 'Generated with Jasmine',
        private: !!isPrivate,
        auto_init: false,
      }),
    });

    const owner = repo.owner?.login;
    const repoFull = repo.full_name;
    if (!owner || !repoFull) throw new Error('Failed to create repo');

    // 2. Create blobs for each file
    const blobs = {};
    for (const [path, content] of Object.entries(filtered)) {
      const body = typeof content === 'string' ? content : String(content);
      const blob = await ghFetch(token, `/repos/${owner}/${name}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: body, encoding: 'utf-8' }),
      });
      blobs[path] = blob.sha;
    }

    // 3. Create tree
    const tree = Object.entries(blobs).map(([path, sha]) => ({
      path,
      mode: '100644',
      type: 'blob',
      sha,
    }));

    const treeRes = await ghFetch(token, `/repos/${owner}/${name}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ tree }),
    });

    // 4. Create commit
    const commitRes = await ghFetch(token, `/repos/${owner}/${name}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Initial commit — generated with Jasmine',
        tree: treeRes.sha,
      }),
    });

    // 5. Create ref (main branch)
    await ghFetch(token, `/repos/${owner}/${name}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: 'refs/heads/main',
        sha: commitRes.sha,
      }),
    });

    const url = repo.html_url;
    return res.status(200).json({
      success: true,
      url,
      cloneUrl: repo.clone_url,
      repo: repoFull,
    });
  } catch (e) {
    console.error('[github/push]', e?.message);
    return res.status(500).json({
      error: e?.message || 'GitHub push failed',
    });
  }
}
