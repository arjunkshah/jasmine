/**
 * Compress large API payloads to avoid Vercel's 4.5MB body limit (413).
 * Uses gzip; JSON typically compresses to ~10-20% of original size.
 */
const COMPRESS_THRESHOLD = 3 * 1024 * 1024; // 3MB

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
 * @param {string} url
 * @param {Object} payload
 * @param {RequestInit} [opts]
 * @returns {Promise<Response>}
 */
export async function fetchApiCompressed(url, payload, opts = {}) {
  const { body, headers } = await prepareApiBody(payload);
  return fetch(url, {
    method: 'POST',
    headers: { ...headers, ...opts.headers },
    body,
    ...opts,
  });
}
