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
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const PROJECTS = 'projects';
const FILES = 'files';
const METADATA_LIMIT = 400 * 1024; // Metadata only should stay well under 1MB

/** Encode file path for use as Firestore doc ID (no slashes) */
function pathToId(path) {
  return String(path).replace(/\//g, '__');
}

/** Decode doc ID back to path */
function idToPath(id) {
  return String(id).replace(/__/g, '/');
}

function payloadSize(obj) {
  return new Blob([JSON.stringify(obj)]).size;
}

/** Metadata only - no files. Stays under 1MB. */
function buildMetadata(data) {
  return {
    userId: data.userId,
    name: data.name || 'Untitled',
    prompt: data.prompt || '',
    provider: data.provider || 'groq',
    gatewayModel: data.gatewayModel || 'kimi-k2.5',
    chatMessages: data.chatMessages || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createProject(userId, data) {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  const meta = buildMetadata({ userId, ...data });
  if (payloadSize(meta) > METADATA_LIMIT) {
    meta.chatMessages = []; // Drop chat history if metadata still too large
  }
  const ref = await addDoc(collection(db, PROJECTS), {
    ...meta,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const files = data.files || {};
  const entries = Object.entries(files);
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    entries.slice(i, i + 400).forEach(([path, content]) => {
      const fileRef = doc(db, PROJECTS, ref.id, FILES, pathToId(path));
      batch.set(fileRef, { path, content: String(content) });
    });
    await batch.commit();
  }
  return ref.id;
}

export async function updateProject(projectId, data) {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  const ref = doc(db, PROJECTS, projectId);
  const { userId, createdAt, files, ...safe } = data;
  const meta = {
    ...safe,
    updatedAt: serverTimestamp(),
  };
  Object.keys(meta).forEach((k) => meta[k] === undefined && delete meta[k]);
  if (payloadSize(meta) > METADATA_LIMIT && meta.chatMessages) {
    meta.chatMessages = meta.chatMessages.slice(-50); // Keep last 50 messages
  }
  await updateDoc(ref, meta);
  if (files && typeof files === 'object' && Object.keys(files).length > 0) {
    const entries = Object.entries(files);
    for (let i = 0; i < entries.length; i += 400) {
      const batch = writeBatch(db);
      entries.slice(i, i + 400).forEach(([path, content]) => {
        const fileRef = doc(db, PROJECTS, projectId, FILES, pathToId(path));
        batch.set(fileRef, { path, content: String(content) });
      });
      await batch.commit();
    }
  }
}

export async function deleteProject(projectId) {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  const filesRef = collection(db, PROJECTS, projectId, FILES);
  const snap = await getDocs(filesRef);
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const b = writeBatch(db);
    docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  await deleteDoc(doc(db, PROJECTS, projectId));
}

export async function listProjects(userId) {
  if (!isFirebaseConfigured() || !db) return [];
  const q = query(
    collection(db, PROJECTS),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getProject(projectId) {
  if (!isFirebaseConfigured() || !db) return null;
  const ref = doc(db, PROJECTS, projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  let files = {};
  if (data.files && typeof data.files === 'object' && Object.keys(data.files).length > 0) {
    files = data.files;
  } else {
    const filesRef = collection(db, PROJECTS, projectId, FILES);
    const filesSnap = await getDocs(filesRef);
    filesSnap.docs.forEach((d) => {
      const { path, content } = d.data();
      files[path || idToPath(d.id)] = content ?? '';
    });
  }
  const { files: _f, ...rest } = data;
  return { id: snap.id, ...rest, files };
}
