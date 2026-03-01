import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const WAITLIST_COLLECTION = 'waitlist';

export async function addToWaitlist(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('Waitlist is not configured');
  }
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Please enter a valid email');
  }
  const ref = await addDoc(collection(db, WAITLIST_COLLECTION), {
    email: trimmed,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
