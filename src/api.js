import { SYSTEM_PROMPT, EDIT_SYSTEM_PROMPT, HTML_SYSTEM_PROMPT, HTML_EDIT_SYSTEM_PROMPT, enhanceUserPrompt } from './systemPrompt.js';
import { fixPhosphorIcons, applyPackageFixes } from './lib/package-fixes.js';
import { fetchApiCompressed } from './lib/compress-api.js';

export { fixPhosphorIcons, applyPackageFixes };

function buildContextBlock(files, searchContext = null) {
  const parts = [];
  if (searchContext?.length) {
    const searchBlock = searchContext.map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet || ''}`).join('\n\n');
    parts.push(`\n\nWEB SEARCH CONTEXT (use for current info, trends, references):\n\n${searchBlock}\n\n`);
  }
  if (files?.length) {
    const blocks = files.map((f) => `---FILE:${f.name}---\n${typeof f.content === 'string' ? f.content : ''}`).join('\n\n');
    parts.push(`\n\nADDITIONAL CONTEXT (user-uploaded files — use for reference):\n\n${blocks}\n\n`);
  }
  return parts.join('');
}

/** Ask the AI if it needs to search the web for this prompt. Returns search query or null. */
export async function decideSearchQuery(prompt, provider, apiKey, apiBase = '', gatewayModel = 'kimi-k2.5') {
  if (!prompt?.trim()) return null;
  if (provider === 'ai-gateway') {
    try {
      const res = await fetch(`${apiBase}/api/decide-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: gatewayModel }),
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      return data.query || null;
    } catch (e) {
      console.warn('[Jasmine] decideSearchQuery (gateway) failed:', e?.message);
      return null;
    }
  }
  if (!apiKey) return null;
  const msg = `User wants to build: "${prompt.slice(0, 200)}". Do you need to search the web for current info (trends, references, examples)? Reply with exactly SEARCH:query (one short query, e.g. "2024 web design trends") or NO_SEARCH.`;
  try {
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2-instruct-0905',
          messages: [{ role: 'user', content: msg }],
          stream: false,
          temperature: 0.2,
          max_tokens: 80,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
      const m = text.match(/SEARCH:\s*(.+)/);
      return m ? m[1].trim().slice(0, 100) : null;
    }
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: msg }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 80 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toUpperCase();
    const m = text.match(/SEARCH:\s*(.+)/);
    return m ? m[1].trim().slice(0, 100) : null;
  } catch (e) {
    console.warn('[Jasmine] decideSearchQuery failed:', e?.message);
    return null;
  }
}

/** Web search — Serper or Tavily. Requires SERPER_API_KEY or TAVILY_API_KEY in Vercel env. */
export async function webSearch(query, apiBase = '') {
  const res = await fetch(`${apiBase}/api/web-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.results) return data.results;
  throw new Error(data?.error || 'Web search failed');
}

export async function generateWithGroq(apiKey, prompt, onChunk, contextFiles = [], searchContext = null, systemPrompt = SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles, searchContext);
  const userContent = enhanceUserPrompt(prompt) + contextBlock;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2-instruct-0905',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }

  return streamResponse(response, onChunk);
}

export async function editWithGroq(apiKey, currentCode, userMessage, onChunk, contextFiles = [], systemPrompt = EDIT_SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles);
  const prompt = `EDIT REQUEST: ${userMessage}\n\nCURRENT PROJECT (only modify what's needed):\n${currentCode.slice(0, 12000)}${contextBlock}\n\nMake minimal targeted edits. Output ONLY the files you changed in ---FILE:path--- format.`;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moonshotai/kimi-k2-instruct-0905',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
      temperature: 0.5,
      max_tokens: 16384,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error: ${response.status}`);
  }
  return streamResponse(response, onChunk);
}

export async function editWithGemini(apiKey, currentCode, userMessage, onChunk, contextFiles = [], systemPrompt = EDIT_SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles);
  const prompt = `EDIT REQUEST: ${userMessage}\n\nCURRENT PROJECT (only modify what's needed):\n${currentCode.slice(0, 12000)}${contextBlock}\n\nMake minimal targeted edits. Output ONLY the files you changed in ---FILE:path--- format.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 16384 },
      }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }
  return streamGeminiResponse(response, onChunk);
}

export async function generateWithGemini(apiKey, prompt, onChunk, contextFiles = [], searchContext = null, systemPrompt = SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles, searchContext);
  const userContent = enhanceUserPrompt(prompt) + contextBlock;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 32000,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  return streamGeminiResponse(response, onChunk);
}

/** Generate via Vercel AI Gateway (kimi-k2.5, gpt-5.4). No client API key — uses server AI_GATEWAY_API_KEY. */
export async function generateWithGateway(apiBase, modelId, prompt, onChunk, contextFiles = [], searchContext = null, systemPrompt = SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles, searchContext);
  const userContent = enhanceUserPrompt(prompt) + contextBlock;

  const response = await fetch(`${apiBase}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userContent,
      model: modelId || 'kimi-k2.5',
      systemPrompt,
      contextFiles: contextFiles || [],
      searchContext: searchContext || [],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Gateway error: ${response.status}`);
  }

  return streamResponse(response, onChunk);
}

/** Edit via Vercel AI Gateway. */
export async function editWithGateway(apiBase, modelId, currentCode, userMessage, onChunk, contextFiles = [], systemPrompt = EDIT_SYSTEM_PROMPT) {
  const contextBlock = buildContextBlock(contextFiles);
  const prompt = `EDIT REQUEST: ${userMessage}\n\nCURRENT PROJECT (only modify what's needed):\n${currentCode.slice(0, 12000)}${contextBlock}\n\nMake minimal targeted edits. Output ONLY the files you changed in ---FILE:path--- format.`;

  const response = await fetch(`${apiBase}/api/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: modelId || 'kimi-k2.5',
      systemPrompt,
      contextFiles,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `AI Gateway error: ${response.status}`);
  }

  return streamResponse(response, onChunk);
}

async function streamResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;

      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          full += content;
          onChunk(full);
        }
      } catch {}
    }
  }

  return full;
}

async function streamGeminiResponse(response, onChunk) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const parts = json.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.text) {
              full += part.text;
              onChunk(full);
            }
          }
        }
      } catch {}
    }
  }

  return full;
}

export function extractHTML(text) {
  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlMatch) return htmlMatch[0];

  const codeBlockMatch = text.match(/```(?:html)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) return codeBlockMatch[1];

  if (text.includes('<html') && text.includes('</html>')) {
    const start = text.indexOf('<');
    const end = text.lastIndexOf('>') + 1;
    return text.slice(start, end);
  }

  return text;
}

/** Known package versions — used when adding deps from imports. */
const KNOWN_PACKAGE_VERSIONS = {
  'react-router-dom': '^6.20.0',
  '@phosphor-icons/react': '^2.1.6',
  'react-intersection-observer': '^9.5.3',
  'framer-motion': '^11.0.0',
  'clsx': '^2.1.0',
  'tailwind-merge': '^2.2.0',
  'date-fns': '^3.0.0',
  'recharts': '^2.12.0',
  'react-hot-toast': '^2.4.1',
  'sonner': '^1.4.0',
  'vaul': '^0.9.0',
  '@radix-ui/react-dialog': '^1.0.5',
  '@radix-ui/react-dropdown-menu': '^2.0.6',
  '@radix-ui/react-tabs': '^1.0.4',
  '@radix-ui/react-tooltip': '^1.0.7',
  'class-variance-authority': '^0.7.0',
};

/** Normalize import to base package name (e.g. "lucide-react/icons" → "lucide-react"). */
function toBasePackage(spec) {
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0] || spec;
}

/** Extract npm package names from import/require statements. Skips relative paths and built-ins. */
function extractImportedPackages(files) {
  const packages = new Set();
  const re = /(?:from|import)\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const skipPrefixes = ['.', '/', '@/', '~'];
  const skipExact = new Set(['react', 'react-dom']);
  for (const content of Object.values(files || {})) {
    if (typeof content !== 'string') continue;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(content)) !== null) {
      const raw = (m[1] || m[2] || '').trim();
      if (!raw) continue;
      if (skipPrefixes.some((p) => raw === p || raw.startsWith(p))) continue;
      if (skipExact.has(raw)) continue;
      packages.add(toBasePackage(raw));
    }
  }
  return packages;
}

/** Ensure package.json has all dependencies used in imports. Mutates files in place. */
export function ensurePackageDependencies(files) {
  if (!files || typeof files !== 'object') return files;
  const raw = files['package.json'];
  if (!raw || typeof raw !== 'string') return files;
  try {
    const pkg = JSON.parse(raw);
    const deps = { ...(pkg.dependencies || {}) };
    const imported = extractImportedPackages(files);
    let changed = false;
    for (const name of imported) {
      if (!deps[name]) {
        deps[name] = KNOWN_PACKAGE_VERSIONS[name] ?? '*';
        changed = true;
      }
    }
    if (changed) {
      pkg.dependencies = deps;
      files['package.json'] = JSON.stringify(pkg, null, 2);
    }
  } catch (_) {}
  return files;
}

/** Repair truncated import paths that cause "Unterminated string literal" (e.g. import X from './components/). */
function fixUnterminatedStringsInContent(content) {
  if (!content || typeof content !== 'string') return content;
  return content.replace(
    /^(\s*import\s+(\w+)\s+from\s+)(['"])([^'"]*)$/gm,
    (_, prefix, importName, quote, path) => {
      if (/\.(jsx?|tsx?|mjs|cjs)$/.test(path)) return _; // already complete
      if (path.endsWith('/')) {
        return `${prefix}${quote}${path}${importName}.jsx${quote}`;
      }
      // Truncated path like ./components/us — replace last segment with component name
      const dir = path.replace(/\/[^/]*$/, '/') || './';
      return `${prefix}${quote}${dir}${importName}.jsx${quote}`;
    }
  );
}

/** Remove slash-command lines that the AI mistakenly put inside file content. */
function stripSlashCommandsFromContent(content) {
  if (!content || typeof content !== 'string') return content;
  return content
    .split(/\r?\n/)
    .filter((line) => !line.trim().match(/^\/[\w-]+(?:\s+.*)?$/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/** Extract slash commands from AI output. Returns [{ cmd, arg }] e.g. [{ cmd: 'web-search', arg: 'React trends' }]. */
export function extractSlashCommands(text) {
  if (!text || typeof text !== 'string') return [];
  const commands = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^\/(\w+)(?:\s+(.+))?$/);
    if (m) {
      const cmd = m[1].toLowerCase();
      const arg = (m[2] || '').trim();
      commands.push({ cmd, arg });
    }
  }
  return commands;
}

/** Extract summary from edit response (text before first ---FILE:---). */
export function extractEditSummary(text) {
  if (!text || typeof text !== 'string') return null;
  const idx = text.indexOf('---FILE:');
  if (idx < 0) return text.trim() || null;
  const summary = text.slice(0, idx).trim();
  return summary.length > 0 ? summary : null;
}

/** Extract the file currently being streamed (last ---FILE:--- block, may be partial). Returns { path, content } or null. */
export function extractStreamingFile(text) {
  if (!text || typeof text !== 'string') return null;
  const lastIdx = text.lastIndexOf('---FILE:');
  if (lastIdx < 0) return null;
  const block = text.slice(lastIdx);
  const pathMatch = block.match(/---FILE:([^\n]+)---\s*\n?/);
  if (!pathMatch) return null;
  const path = pathMatch[1].trim();
  const afterHeader = block.slice(pathMatch[0].length);
  const codeMatch = afterHeader.match(/^```\w*\s*\n?([\s\S]*)/);
  let content = codeMatch ? codeMatch[1].trim() : '';
  if (content.endsWith('```')) content = content.slice(0, -3).trimEnd();
  content = stripSlashCommandsFromContent(content);
  content = fixUnterminatedStringsInContent(content);
  return path ? { path, content } : null;
}

/** Parse multi-file output (---FILE:path---). Returns { files: { path: content } } or null. */
export function extractNextProject(text) {
  if (!text || typeof text !== 'string') return null;
  const files = {};
  try {
    // Path: chars until --- (allows dashes in filenames like some-file.jsx)
    const regex = /---FILE:([^\n]+?)---\s*```(?:\w+)?\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const path = match[1].trim();
      let content = match[2].trim();
      content = stripSlashCommandsFromContent(content);
      content = fixUnterminatedStringsInContent(content);
      if (path && content) files[path] = content;
    }
  } catch (e) {
    console.warn('[Jasmine] extractNextProject regex error:', e?.message);
    return null;
  }
  if (Object.keys(files).length > 0) return { files };
  return null;
}

/** Convert project files to ---FILE:path--- format for edit API. */
export function projectToRaw(project) {
  if (!project?.files || typeof project.files !== 'object') return '';
  return Object.entries(project.files)
    .map(([path, content]) => `---FILE:${path}---\n\`\`\`\n${typeof content === 'string' ? content : String(content)}\n\`\`\``)
    .join('\n\n');
}

/** Get HTML string for iframe srcdoc (HTML mode). Handles index.html or combines index.html + style.css + script.js. */
export function getHtmlPreviewContent(project) {
  if (!project?.files || typeof project.files !== 'object') return '';
  const files = project.files;
  const html = files['index.html'] ?? files['index.htm'] ?? '';
  if (typeof html === 'string' && html.trim()) return html;
  // Fallback: if we have style.css and script.js, build a minimal HTML
  const css = files['style.css'] ?? files['styles.css'] ?? '';
  const js = files['script.js'] ?? files['main.js'] ?? '';
  if (css || js) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script>${css ? `<style>${css}</style>` : ''}</head><body></body>${js ? `<script>${js}</script>` : ''}</html>`;
  }
  return '';
}

const IMAGE_PLACEHOLDER_REGEX = /\{\{IMAGE:([^}]+)\}\}/g;

const FIX_ERRORS_PROMPT = `You are a code reviewer. Review this Vite + React project and fix ALL errors.

## DEPENDENCIES (CRITICAL)
Scan EVERY file for import/require statements. For each npm package (not relative paths like ./ or ../):
- If package.json dependencies does NOT include it, ADD it with a sensible version.
- Use common versions: vite ^4.3.9, @vitejs/plugin-react ^4.0.0, react-router-dom ^6.20.0, @phosphor-icons/react ^2.1.6, react-intersection-observer ^9.5.3, framer-motion ^11.0.0, recharts ^2.12.0, date-fns ^3.0.0, clsx ^2.1.0, tailwind-merge ^2.2.0, @radix-ui/* ^1.0.0. NEVER use lucide-react — use @phosphor-icons/react only. NEVER use vite ^5 or ^6 — use vite ^4.3.9 only. For unknown packages use * (accept any version).
- NEVER remove a dependency that is imported. ALWAYS add missing ones. Add ANY package — we install everything (unknown packages get *).

## OTHER FIXES
1. **Unterminated literals** — Unclosed strings, template literals, JSX tags, brackets.
2. **File not found / phantom imports** — Every import must have a corresponding file. Create the file or remove the import. Check path casing.
3. **main.jsx casing** — React, ReactDOM, createRoot, getElementById, App — exact casing. Import from './App.jsx'.
4. **Styling** — Invalid Tailwind (dark-950 → zinc-950). Phosphor: HomeIcon → HouseIcon.
5. **Missing exports** — Every imported component must exist with export default or export { X }.
6. **package.json** — Valid JSON, no trailing commas.
7. **Responsive** — min-w-0, overflow-hidden on flex children.
8. **Phosphor icons** — Each icon imported ONCE. Never: import { UserIcon, UserIcon, UserIcon }. Use: import { UserIcon } and reference it multiple times in JSX. NEVER use: HomeIcon, MailIcon, etc. Use: HouseIcon, EnvelopeIcon, UsersIcon, MagnifyingGlassIcon, ListIcon, XIcon. Valid: HouseIcon, UserIcon, UsersIcon, CheckIcon, StarIcon, ArrowRightIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, MagnifyingGlassIcon, ListIcon, XIcon, GearIcon.
9. **Invalid RegExp** — ONLY valid flags: g, i, m, s, u, y. Remove x, e, duplicates. Invalid flags cause SyntaxError.
10. **src/index.css** — If missing, add with @tailwind base; @tailwind components; @tailwind utilities;
11. **Tailwind v3 ONLY** — Use tailwindcss ^3.3.0 with postcss + autoprefixer. NEVER use tailwindcss ^4 or @tailwindcss/vite. index.css must use @tailwind base/components/utilities, NOT @import "tailwindcss". Remove @tailwindcss/vite from vite.config.
12. **Vite v4 ONLY** — Use vite ^4.3.9 and @vitejs/plugin-react ^4.0.0 in devDependencies. NEVER use vite ^5, ^6, or ^7 — causes "Cannot find module dep-*.js" in preview.

Output ONLY the changed files in ---FILE:path--- format. Each file complete. No explanations. If nothing to fix, output: NO_CHANGES_NEEDED.`;

/** Post-generation: use the OTHER model to review and fix errors. Runs up to 2 passes. Returns merged files or null. */
export async function fixProjectErrors(project, primaryProvider, groqKey, geminiKey, apiBase = '', gatewayModel = 'kimi-k2.5') {
  if (!project?.files || Object.keys(project.files).length === 0) return null;

  if (primaryProvider === 'ai-gateway') {
    const otherModel = gatewayModel === 'kimi-k2.5' ? 'gpt-5.4' : 'kimi-k2.5';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetchApiCompressed(`${apiBase}/api/fix-errors`, { project, modelId: otherModel }, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      if (!data.fixed || !data.files) return null;
      let current = { ...data.files };
      applyPackageFixes(current);
      ensurePackageDependencies(current);
      return current;
    } catch (e) {
      console.warn('[Jasmine] fixProjectErrors (gateway) failed:', e?.message);
      return null;
    }
  }

  // When primary is gemini, use ai-gateway for fix (no groq). When primary is ai-gateway, handled above.
  if (primaryProvider === 'gemini') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetchApiCompressed(`${apiBase}/api/fix-errors`, { project, modelId: 'kimi-k2.5' }, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      if (!data.fixed || !data.files) return null;
      let current = { ...data.files };
      applyPackageFixes(current);
      ensurePackageDependencies(current);
      return current;
    } catch (e) {
      console.warn('[Jasmine] fixProjectErrors (gateway fallback) failed:', e?.message);
      return null;
    }
  }

  return null;
}

/** Replace {{IMAGE:prompt}} placeholders with AI-generated images. Uses Nano Banana Pro (Replicate) — server needs REPLICATE_API_TOKEN. */
export async function replaceImagePlaceholders(text, apiBase = '', _unused = '') {
  if (!text || typeof text !== 'string') return text;
  const matches = [...text.matchAll(IMAGE_PLACEHOLDER_REGEX)];
  if (matches.length === 0) return text;

  const placeholder = (prompt) => `https://placehold.co/800x600?text=${encodeURIComponent(prompt.slice(0, 30))}`;

  let result = text;
  const seen = new Set();
  let skipApi = false;

  for (const match of matches) {
    const full = match[0];
    const prompt = match[1].trim();
    if (seen.has(full)) continue;
    seen.add(full);

    if (skipApi) {
      result = result.split(full).join(placeholder(prompt));
      continue;
    }

    try {
      const res = await fetch(`${apiBase}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.image) {
        result = result.split(full).join(data.image);
        if (data.placeholder) skipApi = true; // All providers failed; use placeholders for rest
      } else {
        result = result.split(full).join(placeholder(prompt));
        const errMsg = (data?.error || '').toLowerCase();
        if (!res.ok) {
          if (errMsg.includes('token') || errMsg.includes('replicate') || errMsg.includes('required')) {
            skipApi = true;
            console.warn('[Jasmine] Image gen disabled. Add API key (OpenAI, Replicate, Gemini, or AI Gateway). Using placeholders.');
          } else if (data?.error) console.warn('[Jasmine] image gen:', data.error);
        }
      }
    } catch (e) {
      console.warn('[Jasmine] image gen failed:', prompt?.slice(0, 50), e?.message);
      result = result.split(full).join(placeholder(prompt));
      skipApi = true;
    }
  }
  return result;
}

