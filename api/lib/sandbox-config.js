/**
 * Sandbox configuration — patterns from open-lovable
 * @see https://github.com/firecrawl/open-lovable (config/app.config.ts, lib/sandbox/providers/e2b-provider.ts)
 * Central config for E2B sandbox timeouts, ports, and startup behavior.
 */
export const sandboxConfig = {
  e2b: {
    /** Sandbox timeout in minutes (E2B API) */
    timeoutMinutes: 30,
    get timeoutMs() {
      return this.timeoutMinutes * 60 * 1000;
    },
    /** Next.js production server port */
    nextPort: 3000,
    /** Initial delay (ms) after starting next start before first health check */
    startupDelayMs: 5000,
    /** Max poll attempts for server readiness (1 attempt per second) */
    maxPollAttempts: 30,
    /** Timeout per fetch during polling (ms) */
    pollFetchTimeoutMs: 3000,
  },
};
