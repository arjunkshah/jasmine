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
const BATCH_SIZE_LIMIT = 7 * 1024 * 1024; // 7MB — Firestore batch request limit is 10MB
const COMPRESS_THRESHOLD = 1024; // Compress files > 1KB (code compresses well)
const MAX_FILE_DOC_BYTES = 900 * 1024; // Firestore doc limit 1MB; stay under

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

/** Compress string with gzip, return base64. */
async function gzipToBase64(str) {
  const blob = new Blob([str]);
  const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
  const arr = await new Response(stream).arrayBuffer();
  const bytes = new Uint8Array(arr);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Decompress base64 gzip to string. */
async function base64ToGzip(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

/** Prepare file doc for storage: compress if beneficial, truncate if too large. */
async function prepareFileDoc(path, content) {
  let str = String(content);
  if (str.length >= COMPRESS_THRESHOLD && typeof CompressionStream !== 'undefined') {
    const compressed = await gzipToBase64(str);
    const doc = { path, c: compressed, z: 1 };
    if (payloadSize(doc) <= MAX_FILE_DOC_BYTES) return doc;
  }
  const doc = { path, c: str };
  if (payloadSize(doc) > MAX_FILE_DOC_BYTES) {
    const maxChars = Math.floor((MAX_FILE_DOC_BYTES - path.length - 100) / 2);
    str = str.slice(0, maxChars) + '\n\n// ... truncated (file too large)';
    return { path, c: str };
  }
  return doc;
}

/** Metadata only - no files. Stays under 1MB. */
function buildMetadata(data) {
  return {
    userId: data.userId,
    name: data.name || 'Untitled',
    prompt: data.prompt || '',
    provider: data.provider || 'groq',
    gatewayModel: data.gatewayModel || 'gemini-3-flash',
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
  let batch = writeBatch(db);
  let batchSize = 0;
  let batchCount = 0;
  for (const [path, content] of entries) {
    const fileDoc = await prepareFileDoc(path, content);
    const docSize = payloadSize(fileDoc) + 500;
    if (batchCount > 0 && batchSize + docSize > BATCH_SIZE_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      batchSize = 0;
      batchCount = 0;
    }
    const fileRef = doc(db, PROJECTS, ref.id, FILES, pathToId(path));
    batch.set(fileRef, fileDoc);
    batchSize += docSize;
    batchCount++;
  }
  if (batchCount > 0) await batch.commit();
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
    let batch = writeBatch(db);
    let batchSize = 0;
    let batchCount = 0;
    for (const [path, content] of entries) {
      const fileDoc = await prepareFileDoc(path, content);
      const docSize = payloadSize(fileDoc) + 500;
      if (batchCount > 0 && batchSize + docSize > BATCH_SIZE_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        batchSize = 0;
        batchCount = 0;
      }
      const fileRef = doc(db, PROJECTS, projectId, FILES, pathToId(path));
      batch.set(fileRef, fileDoc);
      batchSize += docSize;
      batchCount++;
    }
    if (batchCount > 0) await batch.commit();
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
    const docs = filesSnap.docs;
    for (const d of docs) {
      const data = d.data();
      const path = data.path || idToPath(d.id);
      if (data.z === 1 && data.c) {
        files[path] = await base64ToGzip(data.c);
      } else if (data.content !== undefined) {
        files[path] = data.content ?? '';
      } else if (data.c !== undefined) {
        files[path] = data.c ?? '';
      } else {
        files[path] = '';
      }
    }
  }
  const { files: _f, ...rest } = data;
  return { id: snap.id, ...rest, files };
}
