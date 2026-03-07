/**
 * Parse request body, handling gzip-compressed payloads (for 413 avoidance).
 * Vercel has a 4.5MB body limit; client compresses large payloads.
 */
import { gunzipSync } from 'node:zlib';

/** Read raw body from Node.js IncomingMessage stream. */
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * Get parsed JSON body from request. Handles X-Compressed: gzip.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<object>}
 */
export async function parseBody(req) {
  if (req.headers['x-compressed'] === 'gzip') {
    let raw;
    if (req.body && Buffer.isBuffer(req.body)) {
      raw = req.body;
    } else {
      raw = await readRawBody(req);
    }
    const decompressed = gunzipSync(raw);
    return JSON.parse(decompressed.toString('utf8'));
  }
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = await readRawBody(req);
  if (raw.length === 0) return {};
  return JSON.parse(raw.toString('utf8'));
}
