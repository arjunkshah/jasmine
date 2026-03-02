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

/** Run all package export fixes. */
export function applyPackageFixes(files) {
  deduplicatePhosphorImports(files);
  fixPhosphorIcons(files);
  fixLucideToPhosphor(files);
  return files;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
