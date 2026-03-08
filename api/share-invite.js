/**
 * Share project via email. Requires auth. Recipients must sign in to access.
 * POST { projectId, emails: string[] }
 */
import { parseBody } from '../lib/parse-body.js';
import { getAdminDb } from '../lib/admin-firebase.js';
import { verifyFirebaseToken } from '../lib/admin-firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

export const config = { maxDuration: 30 };

const RESEND_API = 'https://api.resend.com/emails';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyFirebaseToken(req);
  if (!user?.uid) {
    return res.status(401).json({ error: 'Sign in to share projects' });
  }

  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'RESEND_API_KEY not set. Add it in Vercel env vars for email invites.',
    });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { projectId, emails } = body;
  if (!projectId || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: 'Provide projectId and emails array' });
  }

  const validEmails = emails
    .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
    .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (validEmails.length === 0) {
    return res.status(400).json({ error: 'Provide at least one valid email' });
  }

  const projectRef = db.collection('projects').doc(projectId);
  const snap = await projectRef.get();
  if (!snap.exists) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const data = snap.data();
  if (data.userId !== user.uid) {
    return res.status(403).json({ error: 'You can only share your own projects' });
  }

  const sharedWith = data.sharedWith || [];
  const newEmails = validEmails.filter((e) => !sharedWith.includes(e));
  if (newEmails.length === 0) {
    return res.status(200).json({ success: true, message: 'Already shared with these emails' });
  }

  await projectRef.update({
    sharedWith: FieldValue.arrayUnion(...newEmails),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.JASMINE_APP_URL || 'https://jasmine.vercel.app';
  const shareUrl = `${baseUrl}/p/${projectId}`;
  const projectName = data.name || 'Untitled project';

  const fromEmail = process.env.RESEND_FROM || 'Jasmine <onboarding@resend.dev>';
  const usingDefaultSender = !process.env.RESEND_FROM || fromEmail.includes('onboarding@resend.dev');
  const emailErrors = [];

  for (const email of newEmails) {
    try {
      const emailRes = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `${user.email || 'Someone'} shared a project with you — ${projectName}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">You've been invited to collaborate</h2>
              <p style="color: #333;">${user.email || 'Someone'} shared <strong>${projectName}</strong> with you on Jasmine.</p>
              <p style="color: #666;">Sign in to view and collaborate. You'll need a Jasmine account.</p>
              <a href="${shareUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #eab308; color: #0a0a0b; text-decoration: none; font-weight: 600; border-radius: 8px;">Open project</a>
              <p style="margin-top: 24px; font-size: 12px; color: #999;">If you didn't expect this email, you can ignore it.</p>
            </div>
          `,
        }),
      });
      if (!emailRes.ok) {
        const errText = await emailRes.text();
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.message || parsed.error?.message || errText;
        } catch (_) {}
        console.warn('[share-invite] Resend failed for', email, errText);
        emailErrors.push({ email, error: errMsg });
      }
    } catch (e) {
      console.warn('[share-invite] Email send failed:', e?.message);
      emailErrors.push({ email, error: e?.message || 'Network error' });
    }
  }

  if (emailErrors.length === newEmails.length) {
    const firstErr = emailErrors[0]?.error || 'Email delivery failed';
    return res.status(500).json({
      error: `Could not send invites: ${firstErr}. Verify RESEND_API_KEY and RESEND_FROM (use a verified domain — onboarding@resend.dev only delivers to Resend account owner).`,
    });
  }

  if (emailErrors.length > 0) {
    return res.status(200).json({
      success: true,
      sharedWith: newEmails,
      message: `Invite sent to ${newEmails.length - emailErrors.length} recipient(s). Failed for: ${emailErrors.map((e) => e.email).join(', ')}`,
      emailErrors: emailErrors.map((e) => ({ email: e.email, error: e.error })),
      deliveryWarning: usingDefaultSender,
    });
  }

  return res.status(200).json({
    success: true,
    sharedWith: newEmails,
    message: `Invite sent to ${newEmails.length} recipient(s)`,
    deliveryWarning: usingDefaultSender,
  });
}
