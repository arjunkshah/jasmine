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

export async function createProject(userId, data) {
  const ref = await addDoc(collection(db, PROJECTS), {
    userId,
    name: data.name || 'Untitled',
    prompt: data.prompt || '',
    files: data.files || {},
    html: data.html || '',
    chatMessages: data.chatMessages || [],
    provider: data.provider || 'groq',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(projectId, data) {
  const ref = doc(db, PROJECTS, projectId);
  const { userId, createdAt, ...safe } = data;
  const payload = { ...safe, updatedAt: serverTimestamp() };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
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
