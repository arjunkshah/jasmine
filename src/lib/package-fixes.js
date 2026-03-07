/**
 * Package export fixes — open-lovable style.
 * Prevents "does not provide an export named X" for Phosphor, Lucide, etc.
 * @see https://github.com/firecrawl/open-lovable (lib/icons.ts, build validation)
 */
import { PHOSPHOR_VALID_ICONS } from './phosphor-icons-generated.js';

/** Known bad → good Phosphor icon mappings (AI often uses wrong names from other icon libs). */
export const PHOSPHOR_FIXES = [
  ['HomeIcon', 'HouseIcon'],
  ['MailIcon', 'EnvelopeIcon'],
  ['EmailIcon', 'EnvelopeIcon'],
  ['Family', 'UsersIcon'],
  ['FamilyIcon', 'UsersIcon'],
  ['SearchIcon', 'MagnifyingGlassIcon'],
  ['Search', 'MagnifyingGlassIcon'],
  ['MenuIcon', 'ListIcon'],
  ['Menu', 'ListIcon'],
  ['CloseIcon', 'XIcon'],
  ['Close', 'XIcon'],
  ['SettingsIcon', 'GearIcon'],
  ['Settings', 'GearIcon'],
  ['MessageIcon', 'ChatCircleIcon'],
  ['Message', 'ChatCircleIcon'],
  ['LocationIcon', 'MapPinIcon'],
  ['Location', 'MapPinIcon'],
  ['CalendarIcon', 'CalendarBlankIcon'],
  ['Calendar', 'CalendarBlankIcon'],
  ['PictureIcon', 'ImageIcon'],
  ['Picture', 'ImageIcon'],
  ['ExternalLinkIcon', 'ArrowSquareOutIcon'],
  ['ExternalLink', 'ArrowSquareOutIcon'],
  ['ChevronDownIcon', 'CaretDownIcon'],
  ['ChevronDown', 'CaretDownIcon'],
  ['ChevronUpIcon', 'CaretUpIcon'],
  ['ChevronUp', 'CaretUpIcon'],
  ['ChevronRightIcon', 'CaretRightIcon'],
  ['ChevronRight', 'CaretRightIcon'],
  ['ChevronLeftIcon', 'CaretLeftIcon'],
  ['ChevronLeft', 'CaretLeftIcon'],
  ['ArrowDownIcon', 'CaretDownIcon'],
  ['ArrowUpIcon', 'CaretUpIcon'],
  ['DeleteIcon', 'TrashIcon'],
  ['Delete', 'TrashIcon'],
  ['EditIcon', 'PencilIcon'],
  ['Edit', 'PencilIcon'],
  ['MinusIcon', 'MinusIcon'],
  ['TimesIcon', 'XIcon'],
  ['Times', 'XIcon'],
  ['BarsIcon', 'ListIcon'],
  ['Bars', 'ListIcon'],
  ['HeartIcon', 'HeartIcon'],
  ['ShareIcon', 'ShareNetworkIcon'],
  ['Share', 'ShareNetworkIcon'],
  ['LockIcon', 'LockIcon'],
  ['UnlockIcon', 'LockOpenIcon'],
  ['EyeIcon', 'EyeIcon'],
  ['EyeOffIcon', 'EyeSlashIcon'],
  ['BellIcon', 'BellIcon'],
  ['NotificationIcon', 'BellIcon'],
  ['GiftIcon', 'GiftIcon'],
  ['Gift', 'GiftIcon'],
  ['ShoppingCartIcon', 'ShoppingCartIcon'],
  ['CartIcon', 'ShoppingCartIcon'],
  ['Cart', 'ShoppingCartIcon'],
];

const PHOSPHOR_SAFE_FALLBACK = 'UserIcon';

/** Lucide → Phosphor icon mappings (Lucide is banned; replace if AI uses it). */
const LUCIDE_TO_PHOSPHOR = {
  Home: 'HouseIcon',
  Mail: 'EnvelopeIcon',
  Search: 'MagnifyingGlassIcon',
  Menu: 'ListIcon',
  X: 'XIcon',
  Settings: 'GearIcon',
  MessageCircle: 'ChatCircleIcon',
  MapPin: 'MapPinIcon',
  Calendar: 'CalendarBlankIcon',
  Image: 'ImageIcon',
  ExternalLink: 'ArrowSquareOutIcon',
  ChevronDown: 'CaretDownIcon',
  ChevronUp: 'CaretUpIcon',
  ChevronRight: 'CaretRightIcon',
  ChevronLeft: 'CaretLeftIcon',
  Trash2: 'TrashIcon',
  Pencil: 'PencilIcon',
  Heart: 'HeartIcon',
  Share2: 'ShareNetworkIcon',
  Lock: 'LockIcon',
  Unlock: 'LockOpenIcon',
  Eye: 'EyeIcon',
  EyeOff: 'EyeSlashIcon',
  Bell: 'BellIcon',
  Gift: 'GiftIcon',
  ShoppingCart: 'ShoppingCartIcon',
  User: 'UserIcon',
  Users: 'UsersIcon',
  Check: 'CheckIcon',
  Star: 'StarIcon',
  ArrowRight: 'ArrowRightIcon',
  Phone: 'PhoneIcon',
};

/**
 * Deduplicate Phosphor icon imports. AI sometimes outputs import { UserIcon, UserIcon, UserIcon }.
 * Mutates files in place.
 */
function deduplicatePhosphorImports(files) {
  if (!files || typeof files !== 'object') return;
  const phosphorImportRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@phosphor-icons\/react['"]/g;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string' || !path.match(/\.(jsx?|tsx?)$/)) continue;
    const next = content.replace(phosphorImportRe, (match, namesStr) => {
      const names = namesStr.split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      const unique = [...new Set(names)];
      if (unique.length === names.length) return match;
      return `import { ${unique.join(', ')} } from '@phosphor-icons/react'`;
    });
    if (next !== content) files[path] = next;
  }
}

/**
 * Fix Phosphor icon imports — invalid/non-existent exports → valid ones.
 * Mutates files in place.
 */
export function fixPhosphorIcons(files) {
  if (!files || typeof files !== 'object') return files;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string' || !path.match(/\.(jsx?|tsx?)$/)) continue;
    let next = content;
    for (const [bad, good] of PHOSPHOR_FIXES) {
      if (next.includes(bad)) next = next.replace(new RegExp(escapeRe(bad), 'g'), good);
    }
    // Replace invalid phosphor imports: unknown icons → UserIcon (import + JSX usage)
    const phosphorImportRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@phosphor-icons\/react['"]/g;
    let match;
    phosphorImportRe.lastIndex = 0;
    const toReplace = [];
    while ((match = phosphorImportRe.exec(next)) !== null) {
      const names = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      for (const name of names) {
        if (!PHOSPHOR_VALID_ICONS.has(name) && !PHOSPHOR_FIXES.some(([bad]) => bad === name)) {
          toReplace.push([name, PHOSPHOR_SAFE_FALLBACK]);
        }
      }
    }
    for (const [bad, good] of toReplace) {
      next = next.replace(new RegExp(escapeRe(bad), 'g'), good);
    }
    if (next !== content) files[path] = next;
  }
  return files;
}

/**
 * Replace lucide-react imports with @phosphor-icons/react (Lucide is banned).
 * Mutates files in place.
 */
export function fixLucideToPhosphor(files) {
  if (!files || typeof files !== 'object') return files;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string' || !path.match(/\.(jsx?|tsx?)$/)) continue;
    if (!content.includes('lucide-react')) continue;
    let next = content;
    const lucideImportRe = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g;
    let m;
    while ((m = lucideImportRe.exec(next)) !== null) {
      const origImport = m[0];
      const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      const phosphorNames = names.map((n) => LUCIDE_TO_PHOSPHOR[n] || 'UserIcon');
      const newImport = `import { ${phosphorNames.join(', ')} } from '@phosphor-icons/react'`;
      next = next.replace(origImport, newImport);
      // Replace JSX usage: <Home /> → <HouseIcon />, </Home> → </HouseIcon>
      for (let i = 0; i < names.length; i++) {
        if (names[i] !== phosphorNames[i]) {
          next = next.replace(new RegExp(`<${escapeRe(names[i])}(?=\\s|\\/|>)`, 'g'), `<${phosphorNames[i]}`);
          next = next.replace(new RegExp(`</${escapeRe(names[i])}>`, 'g'), `</${phosphorNames[i]}>`);
        }
      }
    }
    if (next !== content) files[path] = next;
  }
  return files;
}

/** Valid RegExp flags in JavaScript. Invalid flags cause SyntaxError. */
const VALID_REGEX_FLAGS = new Set('gimsuy'); // d (hasIndices) is ES2022, omit for broad compat

/**
 * Sanitize regex flags: keep only g, i, m, s, u, y; remove duplicates.
 * AI often outputs invalid flags (e.g. x, e, or duplicates) causing "Invalid regular expression flags".
 */
function sanitizeRegexFlags(flags) {
  if (!flags || typeof flags !== 'string') return '';
  const seen = new Set();
  let out = '';
  for (const c of flags) {
    if (VALID_REGEX_FLAGS.has(c) && !seen.has(c)) {
      seen.add(c);
      out += c;
    }
  }
  return out;
}

/**
 * Fix invalid RegExp flags in generated code. Mutates files in place.
 * Handles: /pattern/flags and new RegExp('pattern', 'flags')
 * Valid JS flags: g, i, m, s, u, y. Invalid (e.g. x, e) cause SyntaxError.
 */
function fixInvalidRegexFlags(files) {
  if (!files || typeof files !== 'object') return;
  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    try {
      let next = content;
      // Regex literal: /pattern/flags — pattern = (?:[^/\\]|\\.)* to allow \/ inside
      next = next.replace(/\/((?:[^/\\]|\\.)*)\/([gimsuy]*)([^gimsuy\s]*)/g, (m, pat, valid, invalid) => {
        if (!invalid) return m;
        const fixed = sanitizeRegexFlags(valid + invalid);
        return '/' + pat + '/' + fixed;
      });
      // new RegExp('pattern', 'flags') or new RegExp(pattern, "flags")
      next = next.replace(/new\s+RegExp\s*\(\s*([^,)]+)\s*,\s*['"`]([^'"`]*)['"`]\s*\)/g, (m, pat, flags) => {
        const fixed = sanitizeRegexFlags(flags);
        if (fixed === flags) return m;
        const quote = m.includes("'") ? "'" : m.includes('"') ? '"' : '`';
        return `new RegExp(${pat}, ${quote}${fixed}${quote})`;
      });
      if (next !== content) files[path] = next;
    } catch (e) {
      console.warn('[package-fixes] fixInvalidRegexFlags failed for', path, e?.message);
    }
  }
}

const MINIMAL_INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

/**
 * Ensure required files exist. Prevents 500 on src/index.css when AI omits it.
 */
function ensureRequiredFiles(files) {
  if (!files || typeof files !== 'object') return;
  if (files['src/main.jsx'] && !files['src/index.css']) {
    files['src/index.css'] = MINIMAL_INDEX_CSS;
  }
}

/**
 * Force Vite 4.x in package.json. AI often outputs vite ^5 or ^6.
 * Vite 5/6/7 have different internal chunk structure — causes "Cannot find module dep-*.js".
 * E2B template uses npm create vite@4 — we must match.
 */
function fixViteVersion(files) {
  if (!files || typeof files !== 'object') return;
  const pkgRaw = files['package.json'];
  if (!pkgRaw || typeof pkgRaw !== 'string') return;
  try {
    const pkg = JSON.parse(pkgRaw);
    const dev = pkg.devDependencies || {};
    let changed = false;
    if (dev.vite && !/^4\./.test(dev.vite)) {
      dev.vite = '^4.3.9';
      changed = true;
    }
    if (dev['@vitejs/plugin-react'] && !/^4\./.test(dev['@vitejs/plugin-react'])) {
      dev['@vitejs/plugin-react'] = '^4.0.0';
      changed = true;
    }
    if (changed) {
      pkg.devDependencies = dev;
      files['package.json'] = JSON.stringify(pkg, null, 2);
    }
  } catch (_) {}
}

/**
 * Force Tailwind v3 in package.json. AI often outputs tailwindcss ^4 or @tailwindcss/vite.
 * Tailwind v4 has a different structure (no preflight.css) and breaks with postcss.config.js.
 * E2B boilerplate uses v3 + postcss — we must keep that.
 */
function fixTailwindVersion(files) {
  if (!files || typeof files !== 'object') return;
  const pkgRaw = files['package.json'];
  if (!pkgRaw || typeof pkgRaw !== 'string') return;
  try {
    const pkg = JSON.parse(pkgRaw);
    const dev = pkg.devDependencies || {};
    let changed = false;
    if (dev.tailwindcss && !/^3\./.test(dev.tailwindcss)) {
      dev.tailwindcss = '^3.3.0';
      changed = true;
    }
    if (dev['@tailwindcss/vite']) {
      delete dev['@tailwindcss/vite'];
      changed = true;
    }
    if (changed) {
      pkg.devDependencies = dev;
      files['package.json'] = JSON.stringify(pkg, null, 2);
    }
  } catch (_) {}
}

/**
 * Ensure index.css uses Tailwind v3 directives, not v4 @import "tailwindcss".
 */
function fixIndexCssTailwind(files) {
  if (!files || typeof files !== 'object') return;
  const css = files['src/index.css'];
  if (!css || typeof css !== 'string') return;
  if (css.includes('@import "tailwindcss"') || css.includes("@import 'tailwindcss'")) {
    files['src/index.css'] = MINIMAL_INDEX_CSS;
  }
}

/**
 * Remove @tailwindcss/vite from vite.config — we use postcss + tailwind v3.
 */
function fixViteConfigTailwind(files) {
  if (!files || typeof files !== 'object') return;
  for (const path of ['vite.config.js', 'vite.config.ts']) {
    const content = files[path];
    if (!content || typeof content !== 'string') continue;
    if (!content.includes('@tailwindcss/vite') && !content.includes('tailwindcss()')) continue;
    let next = content
      .replace(/import\s+tailwindcss\s+from\s+['"]@tailwindcss\/vite['"]\s*;?\s*\n?/g, '')
      .replace(/,?\s*tailwindcss\(\)\s*,?/g, '');
    next = next.replace(/,(\s*,)+/g, ',');
    if (next !== content) files[path] = next;
  }
}

/** Run all package export fixes. */
export function applyPackageFixes(files) {
  fixInvalidRegexFlags(files);
  ensureRequiredFiles(files);
  fixViteVersion(files);
  fixTailwindVersion(files);
  fixIndexCssTailwind(files);
  fixViteConfigTailwind(files);
  deduplicatePhosphorImports(files);
  fixPhosphorIcons(files);
  fixLucideToPhosphor(files);
  return files;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
