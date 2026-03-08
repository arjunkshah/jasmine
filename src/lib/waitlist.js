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
    email: String(email).trim().toLowerCase(),
    uid,
    provider: provider || 'email',
    createdAt: serverTimestamp(),
  });
}

export async function isEmailInWaitlist(email) {
  if (!isFirebaseConfigured() || !db) return false;
  const q = query(
    collection(db, WAITLIST),
    where('email', '==', String(email).trim().toLowerCase())
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
