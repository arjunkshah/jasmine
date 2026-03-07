/**
 * Compress large API payloads to avoid Vercel's 4.5MB body limit (413).
 * Uses gzip; JSON typically compresses to ~10-20% of original size.
 */
const COMPRESS_THRESHOLD = 512 * 1024; // 512KB — compress early; code compresses well
const MAX_PAYLOAD_BYTES = 3.5 * 1024 * 1024; // 3.5MB — truncate files if larger (compress → ~700KB)

/** Max chars per file when truncating. Ensures total payload stays under limit. */
const MAX_CHARS_PER_FILE = 80 * 1024; // 80KB per file

/** Truncate large file contents so total payload fits under limit. Mutates in place. */
function truncateFiles(files) {
  if (!files || typeof files !== 'object') return;
  for (const [path, content] of Object.entries(files)) {
    const str = typeof content === 'string' ? content : String(content);
    if (str.length > MAX_CHARS_PER_FILE) {
      files[path] = str.slice(0, MAX_CHARS_PER_FILE) + '\n\n// ... truncated for request size limit';
    }
  }
}

/** Truncate payload to fit under Vercel body limit. Mutates payload. */
function truncateSandboxPayload(payload) {
  const files = payload?.files || payload?.project?.files;
  if (!files || typeof files !== 'object') return payload;
  if (new Blob([JSON.stringify(payload)]).size <= MAX_PAYLOAD_BYTES) return payload;
  truncateFiles(files);
  if (new Blob([JSON.stringify(payload)]).size <= MAX_PAYLOAD_BYTES) return payload;
  for (const path of Object.keys(files).sort((a, b) => (files[b]?.length || 0) - (files[a]?.length || 0))) {
    if (path === 'package.json' || path === 'index.html' || path === 'src/main.jsx') continue;
    delete files[path];
    if (new Blob([JSON.stringify(payload)]).size <= MAX_PAYLOAD_BYTES) break;
  }
  return payload;
}

/** Compress data with gzip using browser CompressionStream. */
async function gzipCompress(data) {
  const blob = new Blob([data]);
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  return await new Response(stream).arrayBuffer();
}

/**
 * Prepare body and headers for API requests. Compresses when payload exceeds threshold.
 * @param {Object} payload - JSON-serializable payload
 * @returns {Promise<{ body: string | ArrayBuffer, headers: Record<string, string> }>}
 */
export async function prepareApiBody(payload) {
  const json = JSON.stringify(payload);
  const size = new Blob([json]).size;
  if (size > COMPRESS_THRESHOLD) {
    const compressed = await gzipCompress(json);
    return {
      body: compressed,
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Compressed': 'gzip',
      },
    };
  }
  return {
    body: json,
    headers: { 'Content-Type': 'application/json' },
  };
}

/**
 * POST to API with automatic compression for large payloads.
 * For sandbox/update and fix-errors, truncates files if payload would exceed limit.
 * @param {string} url
 * @param {Object} payload
 * @param {RequestInit} [opts]
 * @returns {Promise<Response>}
 */
export async function fetchApiCompressed(url, payload, opts = {}) {
  const isSandboxOrFix = /\/api\/(sandbox\/update|fix-errors|deploy|netlify\/deploy)/.test(url);
  let toSend = payload;
  if (isSandboxOrFix) {
    const copy = payload.files ? { ...payload, files: { ...payload.files } } : payload.project?.files
      ? { ...payload, project: { ...payload.project, files: { ...payload.project.files } } }
      : { ...payload };
    toSend = truncateSandboxPayload(copy);
  }
  const { body, headers } = await prepareApiBody(toSend);
  return fetch(url, {
    method: 'POST',
    headers: { ...headers, ...opts.headers },
    body,
    ...opts,
  });
}
