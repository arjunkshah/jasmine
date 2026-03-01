/**
 * Analytics — track generations, edits, deploys.
 * Uses Firebase Analytics when configured (measurementId in env).
 * No-ops when not configured.
 */

import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from './firebase';

let analyticsInstance = null;

function getAnalyticsInstance() {
  if (analyticsInstance !== null) return analyticsInstance;
  if (typeof window === 'undefined') return null;
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;
  try {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  } catch (e) {
    console.warn('[Jasmine] Analytics init failed:', e?.message);
    return null;
  }
}

function safeLogEvent(name, params = {}) {
  try {
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, name, params);
  } catch (e) {
    console.warn('[Jasmine] Analytics log failed:', e?.message);
  }
}

/** Track a successful generation. */
export function trackGeneration({ provider, fileCount, hasContextFiles, hasSearchContext }) {
  safeLogEvent('jasmine_generate', {
    provider: provider || 'unknown',
    file_count: fileCount || 0,
    has_context_files: !!hasContextFiles,
    has_search_context: !!hasSearchContext,
  });
}

/** Track a successful edit. */
export function trackEdit({ provider, fileCount }) {
  safeLogEvent('jasmine_edit', {
    provider: provider || 'unknown',
    file_count: fileCount || 0,
  });
}

/** Track a successful deploy (Netlify). */
export function trackDeploy({ platform = 'netlify' }) {
  safeLogEvent('jasmine_deploy', { platform });
}
