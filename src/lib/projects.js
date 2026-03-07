import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const PROJECTS = 'projects';
const FIRESTORE_LIMIT = 900 * 1024; // ~900KB (Firestore doc limit 1MB)

function payloadSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

/** Truncate payload to fit Firestore limit. Drops files/html when too large. */
function fitPayload(data) {
  const base = {
    userId: data.userId,
    name: data.name || 'Untitled',
    prompt: data.prompt || '',
    provider: data.provider || 'groq',
    gatewayModel: data.gatewayModel || 'kimi-k2.5',
    chatMessages: data.chatMessages || [],
    files: data.files || {},
    html: data.html || '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  if (payloadSize(base) <= FIRESTORE_LIMIT) return base;
  const { files, html, ...meta } = base;
  const minimal = { ...meta, files: {}, html: '', _truncated: true };
  return minimal;
}

export async function createProject(userId, data) {
  const payload = fitPayload({ userId, ...data });
  const ref = await addDoc(collection(db, PROJECTS), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(projectId, data) {
  const ref = doc(db, PROJECTS, projectId);
  const { userId, createdAt, ...safe } = data;
  let payload = { ...safe, updatedAt: serverTimestamp() };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  if (payloadSize(payload) > FIRESTORE_LIMIT) {
    payload = { name: safe.name, prompt: safe.prompt, _truncated: true, updatedAt: serverTimestamp() };
  }
  await updateDoc(ref, payload);
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, PROJECTS, projectId));
}

export async function listProjects(userId) {
  const q = query(
    collection(db, PROJECTS),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProject(projectId) {
  const ref = doc(db, PROJECTS, projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
