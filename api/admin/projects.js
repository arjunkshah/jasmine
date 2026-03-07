/**
 * Admin: list all projects (and users derived from them).
 * GET /api/admin/projects
 * Auth: x-admin-key header (ADMIN_API_KEY)
 */
import { getAdminDb, requireAdminKey } from '../../lib/admin-firebase.js';

const PROJECTS = 'projects';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = requireAdminKey(req);
  if (!auth.ok) {
    return res.status(401).json({ error: auth.error || 'Unauthorized' });
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  try {
    const snap = await db.collection(PROJECTS).orderBy('updatedAt', 'desc').limit(500).get();
    const projects = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId,
        name: data.name || 'Untitled',
        prompt: (data.prompt || '').slice(0, 200),
        provider: data.provider,
        fileCount: data.files ? Object.keys(data.files).length : 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
      };
    });
    const userIds = [...new Set(projects.map((p) => p.userId).filter(Boolean))];
    return res.status(200).json({ projects, userIds, total: projects.length });
  } catch (e) {
    console.error('[admin/projects] failed:', e);
    return res.status(500).json({ error: e?.message || 'List failed' });
  }
}
