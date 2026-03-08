import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const WAITLIST = 'waitlist';

export async function addToWaitlist({ email, uid, provider }) {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  await addDoc(collection(db, WAITLIST), {
    email: String(email).trim(),
    uid,
    provider: provider || 'email',
    createdAt: serverTimestamp(),
  });
}

/** Check if the given email is already in the waitlist. Requires the user to be signed in (Firestore rules allow read only when resource.data.email matches auth token). */
export async function isEmailInWaitlist(email) {
  if (!isFirebaseConfigured() || !db) return false;
  const normalized = String(email).trim();
  if (!normalized) return false;
  try {
    const q = query(
      collection(db, WAITLIST),
      where('email', '==', normalized)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}
