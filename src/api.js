/**
 * Parsing and project utilities. No AI generation — new backend coming.
 */
import { fixPhosphorIcons, applyPackageFixes } from './lib/package-fixes.js';
import { fixUnterminatedStringsInContent } from './lib/fix-unterminated.js';
export { fixPhosphorIcons, applyPackageFixes };

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

/** Extract slash commands from AI output. Returns [{ cmd, arg }]. */
export function extractSlashCommands(text) {
  if (!text || typeof text !== 'string') return [];
  const commands = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^\/(\w+)(?:\s+(.+))?$/);
    if (m) {
      commands.push({ cmd: m[1].toLowerCase(), arg: (m[2] || '').trim() });
    }
  }
  return commands;
}

/** Extract summary from edit response (text before first ---FILE:--- or ---EDIT:---). */
export function extractEditSummary(text) {
  if (!text || typeof text !== 'string') return null;
  const fileIdx = text.indexOf('---FILE:');
  const editIdx = text.indexOf('---EDIT:');
  const idx = fileIdx < 0 ? editIdx : editIdx < 0 ? fileIdx : Math.min(fileIdx, editIdx);
  const summary = idx < 0 ? text.trim() : text.slice(0, idx).trim();
  return summary.length > 0 ? summary : null;
}

/** Extract the file currently being streamed. Returns { path, content } or null. */
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

/** Parse ---EDIT:path--- blocks with ---SEARCH---/---REPLACE---. */
export function extractEdits(text) {
  if (!text || typeof text !== 'string') return [];
  const edits = [];
  try {
    const blockRegex = /---EDIT:([^\n]+)---\s*\n([\s\S]*?)(?=---EDIT:|---FILE:|\Z)/g;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(text)) !== null) {
      const path = blockMatch[1].trim();
      const block = blockMatch[2];
      const pairRegex = /---SEARCH---\s*\n([\s\S]*?)---REPLACE---\s*\n([\s\S]*?)(?=---SEARCH---|$)/g;
      let pairMatch;
      while ((pairMatch = pairRegex.exec(block)) !== null) {
        const search = pairMatch[1].replace(/\n$/, '');
        const replace = pairMatch[2].replace(/\n$/, '');
        if (path && search) edits.push({ path, search, replace });
      }
    }
  } catch (e) {
    console.warn('[Jasmine] extractEdits error:', e?.message);
  }
  return edits;
}

/** Parse multi-file output (---FILE:path---) and minimal edits (---EDIT:path---). Returns { files } or null. */
export function extractNextProject(text, existingFiles = null) {
  if (!text || typeof text !== 'string') return null;
  const files = {};
  const edits = extractEdits(text);
  try {
    const regex = /---FILE:([^\n]+?)---\s*```(?:\w+)?\s*\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const path = match[1].trim();
      let content = match[2].trim();
      content = stripSlashCommandsFromContent(content);
      content = fixUnterminatedStringsInContent(content);
      if (path && content) files[path] = content;
    }
    if (existingFiles && edits.length > 0) {
      for (const { path, search, replace } of edits) {
        const base = path in files ? files[path] : (existingFiles[path] || '');
        if (base.includes(search)) {
          files[path] = base.replace(search, replace);
        }
      }
    }
  } catch (e) {
    console.warn('[Jasmine] extractNextProject regex error:', e?.message);
    return null;
  }
  if (Object.keys(files).length > 0) return { files };
  return null;
}

/** Convert project files to ---FILE:path--- format. */
export function projectToRaw(project) {
  if (!project?.files || typeof project.files !== 'object') return '';
  return Object.entries(project.files)
    .map(([path, content]) => `---FILE:${path}---\n\`\`\`\n${typeof content === 'string' ? content : String(content)}\n\`\`\``)
    .join('\n\n');
}

/** List HTML page files in project. */
export function getHtmlPages(project) {
  if (!project?.files || typeof project.files !== 'object') return [];
  return Object.keys(project.files).filter((p) => /\.html?$/i.test(p)).sort((a, b) => {
    if (a.toLowerCase() === 'index.html' || a.toLowerCase() === 'index.htm') return -1;
    if (b.toLowerCase() === 'index.html' || b.toLowerCase() === 'index.htm') return 1;
    return a.localeCompare(b);
  });
}

/** Get HTML string for iframe srcdoc (HTML mode). */
export function getHtmlPreviewContent(project, page = null) {
  if (!project?.files || typeof project.files !== 'object') return '';
  const files = project.files;
  const htmlPages = getHtmlPages(project);
  const pageKey = page || htmlPages[0] || 'index.html';
  let html = files[pageKey] ?? '';
  if (typeof html !== 'string' || !html.trim()) return '';
  const cssFiles = Object.entries(files).filter(([p]) => /\.css$/i.test(p));
  const jsFiles = Object.entries(files).filter(([p]) => /\.js$/i.test(p) && !p.includes('node_modules'));
  for (const [path, content] of cssFiles) {
    if (typeof content !== 'string') continue;
    const name = path.split('/').pop();
    const regex = new RegExp(`<link[^>]+href=["']([^"']*${name.replace('.', '\\.')})["'][^>]*>`, 'gi');
    const safeContent = content.replace(/<\/style>/gi, '<\\/style>');
    html = html.replace(regex, `<style>${safeContent}</style>`);
  }
  for (const [path, content] of jsFiles) {
    if (typeof content !== 'string') continue;
    const name = path.split('/').pop();
    const regex = new RegExp(`<script[^>]+src=["']([^"']*${name.replace('.', '\\.')})["'][^>]*>\\s*</script>`, 'gi');
    const safeContent = content.replace(/<\/script>/gi, '<\\/script>');
    html = html.replace(regex, `<script>${safeContent}</script>`);
  }
  return html;
}

const IMAGE_PLACEHOLDER_REGEX = /\{\{IMAGE:([^}]+)\}\}/g;

/** Web search — no backend. Returns empty array. */
export async function webSearch() {
  return [];
}

/** Replace {{IMAGE:prompt}} placeholders with placeholder URLs. */
export async function replaceImagePlaceholders(text) {
  if (!text || typeof text !== 'string') return text;
  const matches = [...text.matchAll(IMAGE_PLACEHOLDER_REGEX)];
  if (matches.length === 0) return text;
  const placeholder = (prompt) => `https://placehold.co/800x600?text=${encodeURIComponent(prompt.slice(0, 30))}`;
  let result = text;
  for (const match of matches) {
    const full = match[0];
    const prompt = match[1].trim();
    result = result.split(full).join(placeholder(prompt));
  }
  return result;
}

/** Known package versions for ensurePackageDependencies. */
const KNOWN_PACKAGE_VERSIONS = {
  'react-router-dom': '^6.20.0', 'lucide-react': '^0.460.0', '@phosphor-icons/react': '^2.1.6',
  'react-intersection-observer': '^9.5.3', 'framer-motion': '^11.0.0', 'clsx': '^2.1.0',
  'tailwind-merge': '^2.2.0', 'date-fns': '^3.0.0', 'recharts': '^2.12.0', 'react-hot-toast': '^2.4.1',
  'sonner': '^1.4.0', 'vaul': '^0.9.0', '@radix-ui/react-dialog': '^1.0.5',
  '@radix-ui/react-dropdown-menu': '^2.0.6', '@radix-ui/react-tabs': '^1.0.4', '@radix-ui/react-tooltip': '^1.0.7',
  'class-variance-authority': '^0.7.0',
};

function toBasePackage(spec) {
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : spec;
  }
  return spec.split('/')[0] || spec;
}

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
      if (!raw || skipPrefixes.some((p) => raw === p || raw.startsWith(p))) continue;
      if (skipExact.has(raw)) continue;
      packages.add(toBasePackage(raw));
    }
  }
  return packages;
}

/** Ensure package.json has all dependencies used in imports. */
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

export { fixUnterminatedStringsInContent } from './lib/fix-unterminated.js';
