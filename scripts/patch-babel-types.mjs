#!/usr/bin/env node
/**
 * Patches @babel/types to fix "COMMENT_KEYS is not iterable" error.
 * See: https://github.com/babel/babel/issues/16694
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = join(__dirname, '../node_modules/@babel/types/lib/modifications/removeProperties.js');

try {
  let content = readFileSync(target, 'utf8');
  if (content.includes('Array.isArray(_index.COMMENT_KEYS)')) {
    process.exit(0); // already patched
  }
  content = content.replace(
    'const CLEAR_KEYS_PLUS_COMMENTS = [..._index.COMMENT_KEYS, "comments", ...CLEAR_KEYS];',
    `const COMMENT_KEYS = Array.isArray(_index.COMMENT_KEYS) ? _index.COMMENT_KEYS : ["leadingComments", "trailingComments", "innerComments"];
const CLEAR_KEYS_PLUS_COMMENTS = [...COMMENT_KEYS, "comments", ...CLEAR_KEYS];`
  );
  writeFileSync(target, content);
  console.log('✓ Patched @babel/types (COMMENT_KEYS fix)');
} catch (err) {
  if (err.code === 'ENOENT') {
    process.exit(0); // package not installed
  }
  console.error('Failed to patch @babel/types:', err.message);
  process.exit(1);
}
