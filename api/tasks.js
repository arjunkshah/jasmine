/**
 * Tasks API — CRUD for admin task/issue list.
 * GET /api/tasks — list all (AI can pull from this)
 * POST /api/tasks — create
 * PATCH /api/tasks?id=xxx — update
 * DELETE /api/tasks?id=xxx — delete
 *
 * Auth: x-admin-key header (ADMIN_API_KEY) for mutate. GET allowed without key for AI access.
 */
import { getAdminDb, requireAdminKey } from '../lib/admin-firebase.js';
import { parseBody } from '../lib/parse-body.js';

const TASKS = 'tasks';

function sendJson(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(status).json(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getAdminDb();
  if (!db) {
    return sendJson(res, { error: 'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT.' }, 500);
  }

  const id = req.query?.id ?? null;

  if (req.method === 'GET') {
    try {
      const snap = await db.collection(TASKS).orderBy('updatedAt', 'desc').get();
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return sendJson(res, { tasks });
    } catch (e) {
      console.error('[tasks] GET failed:', e);
      return sendJson(res, { error: e?.message || 'List failed' }, 500);
    }
  }

  const auth = requireAdminKey(req);
  if (!auth.ok) {
    return sendJson(res, { error: auth.error || 'Unauthorized' }, 401);
  }

  if (req.method === 'POST') {
    const body = await parseBody(req).catch(() => ({}));
    const { title, description, status, priority } = body;
    if (!title || typeof title !== 'string') {
      return sendJson(res, { error: 'title required' }, 400);
    }
    try {
      const ref = await db.collection(TASKS).add({
        title: String(title).trim(),
        description: (description != null ? String(description) : '') || '',
        status: status || 'todo',
        priority: priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const snap = await ref.get();
      return sendJson(res, { id: ref.id, ...snap.data() }, 201);
    } catch (e) {
      console.error('[tasks] POST failed:', e);
      return sendJson(res, { error: e?.message || 'Create failed' }, 500);
    }
  }

  if (req.method === 'PATCH') {
    const body = await parseBody(req).catch(() => ({}));
    const taskId = id || body?.id;
    if (!taskId) return sendJson(res, { error: 'id required (query or body)' }, 400);
    const updates = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description);
    if (body.status !== undefined) updates.status = String(body.status);
    if (body.priority !== undefined) updates.priority = String(body.priority);
    updates.updatedAt = new Date();
    if (Object.keys(updates) <= 1) {
      return sendJson(res, { error: 'No fields to update' }, 400);
    }
    try {
      const ref = db.collection(TASKS).doc(taskId);
      await ref.update(updates);
      const snap = await ref.get();
      if (!snap?.exists) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, { id: snap.id, ...snap.data() });
    } catch (e) {
      console.error('[tasks] PATCH failed:', e);
      return sendJson(res, { error: e?.message || 'Update failed' }, 500);
    }
  }

  let deleteId = id;
  if (!deleteId && req.method === 'DELETE') {
    const body = await parseBody(req).catch(() => ({}));
    deleteId = body?.id ?? null;
  }
  if (req.method === 'DELETE' && deleteId) {
    try {
      await db.collection(TASKS).doc(deleteId).delete();
      return sendJson(res, { ok: true });
    } catch (e) {
      console.error('[tasks] DELETE failed:', e);
      return sendJson(res, { error: e?.message || 'Delete failed' }, 500);
    }
  }

  return sendJson(res, { error: 'Method not allowed' }, 405);
}
