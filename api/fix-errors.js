/**
 * Fix project errors using AI Gateway. Uses the "other" model for review.
 */
import { chatWithGateway } from '../lib/chat.js';
import { parseBody } from '../lib/parse-body.js';
import { projectToRaw, extractNextProject, ensurePackageDependencies } from '../src/api.js';
import { applyPackageFixes } from '../src/lib/package-fixes.js';

const FIX_PROMPT = `You are a code reviewer. Review this Vite + React project and fix ALL errors.

## DEPENDENCIES (CRITICAL)
Scan EVERY file for import/require statements. For each npm package (not relative paths like ./ or ../):
- If package.json dependencies does NOT include it, ADD it with a sensible version.
- Use common versions: react-router-dom ^6.20.0, @phosphor-icons/react ^2.1.6, react-intersection-observer ^9.5.3, framer-motion ^11.0.0, recharts ^2.12.0, date-fns ^3.0.0, clsx ^2.1.0, tailwind-merge ^2.2.0, @radix-ui/* ^1.0.0. NEVER use lucide-react — use @phosphor-icons/react only. For unknown packages use * (accept any version).
- NEVER remove a dependency that is imported. ALWAYS add missing ones.

## OTHER FIXES
1. **Unterminated literals** — Unclosed strings, template literals, JSX tags, brackets.
2. **File not found / phantom imports** — Every import must have a corresponding file.
3. **main.jsx casing** — React, ReactDOM, createRoot, getElementById, App — exact casing.
4. **Styling** — Invalid Tailwind. Phosphor: HomeIcon → HouseIcon.
5. **Missing exports** — Every imported component must exist.
6. **package.json** — Valid JSON, no trailing commas.
7. **Phosphor icons** — Each icon imported ONCE. Use HouseIcon, UserIcon, etc. Never HomeIcon, MailIcon.
8. **Invalid RegExp** — ONLY flags g, i, m, s, u, y. Remove x, e, duplicates.
9. **src/index.css** — If missing, add with @tailwind base/components/utilities.

Output ONLY the changed files in ---FILE:path--- format. Each file complete. No explanations. If nothing to fix, output: NO_CHANGES_NEEDED.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Compressed');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await parseBody(req);
  const { project, modelId } = body;
  if (!project?.files || typeof project.files !== 'object') {
    return res.status(400).json({ error: 'Missing project.files' });
  }

  const model = modelId || 'gpt-5.4';
  const raw = projectToRaw({ files: project.files });
  const prompt = `${FIX_PROMPT}\n\nCURRENT PROJECT:\n${raw.slice(0, 25000)}`;

  try {
    const result = await chatWithGateway(model, [{ role: 'user', content: prompt }], { temperature: 0.2, max_tokens: 16384 });
    if (!result || result.includes('NO_CHANGES_NEEDED')) {
      return res.json({ fixed: false, files: null });
    }
    const fixed = extractNextProject(result);
    if (!fixed?.files || Object.keys(fixed.files).length === 0) {
      return res.json({ fixed: false, files: null });
    }
    let current = { ...project.files, ...fixed.files };
    applyPackageFixes(current);
    ensurePackageDependencies(current);
    return res.json({ fixed: true, files: current });
  } catch (e) {
    console.warn('[api/fix-errors]', e?.message);
    return res.status(500).json({ error: e?.message || 'Fix failed' });
  }
}
