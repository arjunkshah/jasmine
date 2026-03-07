/**
 * Firebase Admin SDK for server-side (API routes).
 * Requires: FIREBASE_SERVICE_ACCOUNT env (JSON string) or GOOGLE_APPLICATION_CREDENTIALS.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb = null;

export function getAdminDb() {
  if (adminDb) return adminDb;
  const apps = getApps();
  if (apps.length === 0) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) {
      try {
        const cred = typeof sa === 'string' ? JSON.parse(sa) : sa;
        initializeApp({ credential: cert(cred) });
      } catch (e) {
        console.warn('[admin-firebase] Invalid FIREBASE_SERVICE_ACCOUNT:', e?.message);
        return null;
      }
    } else {
      try {
        initializeApp(); // Uses GOOGLE_APPLICATION_CREDENTIALS
      } catch (e) {
        console.warn('[admin-firebase] No Firebase Admin creds:', e?.message);
        return null;
      }
    }
  }
  adminDb = getFirestore();
  return adminDb;
}

export function requireAdminKey(req) {
  const key = req.headers['x-admin-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return { ok: true }; // No key configured = allow (dev)
  if (key !== expected) return { ok: false, error: 'Invalid or missing admin key' };
  return { ok: true };
}
