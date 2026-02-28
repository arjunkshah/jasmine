/**
 * Sandbox configuration — open-lovable E2B approach
 * @see https://github.com/firecrawl/open-lovable (config/app.config.ts, lib/sandbox/providers/e2b-provider.ts)
 * Vite port 5173 — no build step, instant hot-reload, fewer timeouts.
 */
export const sandboxConfig = {
  e2b: {
    /** Sandbox timeout in minutes (E2B API) */
    timeoutMinutes: 30,
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },
    /** Vite dev server port — E2B URL format: {port}-{sandboxId}.e2b.app */
    vitePort: 5173,
    /** Alias for compatibility */
    get nextPort() {
      return this.vitePort;
    },
    /** Initial delay (ms) after starting vite before first health check */
    startupDelayMs: 8000,
    /** Max poll attempts for server readiness (1 attempt per second) */
    maxPollAttempts: 30,
    /** Timeout per fetch during polling (ms) */
    pollFetchTimeoutMs: 3000,
  },
};
