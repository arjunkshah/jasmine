/**
 * Repair truncated/unterminated strings that cause "Unterminated string literal" and similar parse errors.
 * Used after AI output parsing, after truncateFiles, and before writing to sandbox.
 */
export function fixUnterminatedStringsInContent(content) {
  if (!content || typeof content !== 'string') return content;
  let out = content;

  // --- Imports ---
  // Pattern 1: import X from './path (default import, truncated)
  out = out.replace(
    /^(\s*import\s+(\w+)\s+from\s+)(['"])([^'"]*)$/gm,
    (_, prefix, importName, quote, path) => {
      if (/\.(jsx?|tsx?|mjs|cjs)$/.test(path)) return `${prefix}${quote}${path}${quote}`;
      if (path.endsWith('/')) return `${prefix}${quote}${path}${importName}.jsx${quote}`;
      const dir = path.replace(/\/[^/]*$/, '/') || './';
      return `${prefix}${quote}${dir}${importName}.jsx${quote}`;
    }
  );
  // Pattern 2: import { X } from './path (named imports, truncated)
  out = out.replace(
    /^(\s*import\s+\{[^}]*\}\s+from\s+)(['"])([^'"]*)$/gm,
    (_, prefix, quote, path) => {
      if (/\.(jsx?|tsx?|mjs|cjs)$/.test(path)) return `${prefix}${quote}${path}${quote}`;
      const m = prefix.match(/import\s+\{\s*(\w+)/);
      const firstName = m ? m[1] : 'index';
      if (path.endsWith('/')) return `${prefix}${quote}${path}${firstName}.jsx${quote}`;
      const dir = path.replace(/\/[^/]*$/, '/') || './';
      return `${prefix}${quote}${dir}${firstName}.jsx${quote}`;
    }
  );
  // Pattern 3: package imports with trailing slash
  out = out.replace(
    /^(\s*import\s+.*?\s+from\s+)(['"])([^'"]*)\/$/gm,
    (_, prefix, quote, path) => {
      if (!path.startsWith('.') && path.length > 0) return `${prefix}${quote}${path}${quote}`;
      return _;
    }
  );

  // --- JSX attributes truncated (className="..., href="..., src="..., alt="..., etc.) ---
  const attrNames = 'className|href|src|alt|placeholder|title|aria-label|id|name|type|value';
  out = out.replace(
    new RegExp(`(\\s(${attrNames})=)(["'])([^"']*)$`, 'gm'),
    (_, prefix, quote, val) => prefix + quote + val + quote
  );

  // --- style={{ ... truncated (missing }}) — [^}]* stops at first }, so only matches when no } in value
  out = out.replace(
    /(style=\{\{[^}]*)(\n|$)/g,
    (m, inner, tail) => inner + ' }}' + tail
  );

  // --- Truncated self-closing JSX: <br / or <Component attr / (missing >) — at EOL or mid-line (e.g. <br / <span)
  out = out.replace(
    /(<[^>\n]*\s+\/)(?!\s*>)/g,
    (_, tag) => tag + '>'
  );

  // --- Lines ending with unclosed " or ' or ` (odd delimiter count) ---
  out = out.split('\n')
    .map((line) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return line;
      const dq = (line.match(/"/g) || []).length;
      if (dq % 2 === 1 && line.endsWith('"') && !line.endsWith('\\"')) return line + '"';
      const sq = (line.match(/'/g) || []).length;
      if (sq % 2 === 1 && line.endsWith("'") && !line.endsWith("\\'")) return line + "'";
      const bk = (line.match(/`/g) || []).length;
      if (bk % 2 === 1 && line.endsWith('`') && !line.endsWith('\\`')) return line + '`';
      return line;
    })
    .join('\n');

  return out;
}
