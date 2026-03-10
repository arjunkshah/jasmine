/**
 * Multi-key rotation and rate-limit handling.
 * Supports comma-separated keys: AI_GATEWAY_API_KEY=key1,key2,key3
 * Or numbered: AI_GATEWAY_API_KEY, AI_GATEWAY_API_KEY_2, AI_GATEWAY_API_KEY_3
 */

/** Parse keys from env. Accepts comma-separated or base + _2, _3 suffixes. */
export function parseKeys(baseKey, getEnv = (k) => process.env[k] || '') {
  const base = (getEnv(baseKey) || '').trim();
  if (!base) return [];

  const fromComma = base.split(',').map((k) => k.trim()).filter(Boolean);
  if (fromComma.length > 1) return fromComma;

  const keys = [base];
  for (let i = 2; i <= 10; i++) {
    const next = (getEnv(`${baseKey}_${i}`) || '').trim();
    if (!next) break;
    keys.push(next);
  }
  return keys;
}

/** Check if error/response indicates rate limit (429). */
export function isRateLimited(status, body) {
  if (status === 429) return true;
  const msg = typeof body === 'string' ? body : body?.error?.message || body?.message || '';
  return /rate limit|too many requests|quota exceeded|resource exhausted/i.test(String(msg));
}

/** Round-robin index (persists per process via module-level counter). */
const counters = {};
export function getNextKeyIndex(keys, keyName = 'default') {
  if (!keys?.length) return 0;
  const n = (counters[keyName] = (counters[keyName] || 0) + 1);
  return (n - 1) % keys.length;
}

/** Get next key for rotation. */
export function getNextKey(keys, keyName = 'default') {
  if (!keys?.length) return null;
  const idx = getNextKeyIndex(keys, keyName);
  return keys[idx];
}

/** Sleep ms. */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Try keys in sequence. On 429, try next key or retry after delay.
 * fn(key) => result. Throws on final failure.
 */
export async function tryWithKeys(fn, keys, keyName = 'default', maxRetries = 2) {
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
  const effectiveKeys = keyList.length ? keyList : [null];
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (let i = 0; i < effectiveKeys.length; i++) {
      const key = effectiveKeys[i];
      try {
        return await fn(key);
      } catch (e) {
        lastError = e;
        const status = e?.status ?? e?.response?.status ?? (e?.message?.includes('429') ? 429 : null);
        const body = e?.body ?? e?.response?.data ?? e?.message ?? '';
        if (isRateLimited(status, body)) {
          if (i < effectiveKeys.length - 1) {
            console.warn(`[api-keys] Rate limited on key ${i + 1}, trying next`);
          } else if (attempt < maxRetries) {
            const delay = 1500 * (attempt + 1);
            console.warn(`[api-keys] All keys rate limited, retrying in ${delay}ms`);
            await sleep(delay);
          }
          continue;
        }
        throw e;
      }
    }
  }
  throw lastError || new Error('All keys rate limited');
}
