#!/usr/bin/env node
/**
 * Test code generation — runs a simple prompt and validates output for common errors.
 * Run: node scripts/test-generation.mjs
 * Requires: VITE_GROQ_API_KEY or GROQ_API_KEY in .env
 */
import 'dotenv/config';
import { generateWithGroq, extractNextProject, ensurePackageDependencies } from '../src/api.js';

const TEST_PROMPT = 'Simple landing page: hero with one headline, one CTA button, and a footer. Dark theme, zinc colors.';

function validateProject(project) {
  const errors = [];
  const files = project?.files || {};
  const paths = new Set(Object.keys(files));

  // 1. Check package.json
  const pkgRaw = files['package.json'];
  if (!pkgRaw) {
    errors.push('Missing package.json');
  } else {
    try {
      const pkg = JSON.parse(pkgRaw);
      const deps = pkg.dependencies || {};
      if (!deps['react-router-dom']) errors.push('package.json: missing react-router-dom');
      if (!deps['@phosphor-icons/react']) errors.push('package.json: missing @phosphor-icons/react');
    } catch (e) {
      errors.push('package.json: invalid JSON - ' + e.message);
    }
  }

  // 2. Extract imports and check files exist
  const importRegex = /import\s+.*?\s+from\s+['"](\.\/[^'"]+)['"]/g;
  for (const [path, content] of Object.entries(files)) {
    if (!path.endsWith('.jsx') && !path.endsWith('.tsx') && !path.endsWith('.js')) continue;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      let importPath = m[1];
      if (!importPath.startsWith('./')) continue;
      const base = path.includes('/') ? path.replace(/\/[^/]+$/, '/') : '';
      const resolved = (base + importPath).replace(/\/\.\//g, '/').replace(/^\/+/, '');
      const withExt = resolved.includes('.') ? resolved : resolved + '.jsx';
      const altExt = resolved.includes('.') ? resolved : resolved + '.tsx';
      if (!paths.has(withExt) && !paths.has(altExt) && !paths.has(resolved)) {
        errors.push(`Phantom import: ${path} imports "${importPath}" but file not found`);
      }
    }
  }

  // 3. Unterminated literals (basic checks)
  for (const [path, content] of Object.entries(files)) {
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`${path}: unbalanced braces { } (${openBraces} open, ${closeBraces} close)`);
    }
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push(`${path}: unbalanced parens ( )`);
    }
    if (content.includes('dark-950') || content.includes('dark-900') || content.includes('dark-800')) {
      errors.push(`${path}: invalid Tailwind dark-* color (use zinc-950, slate-900)`);
    }
  }

  // 4. Required files
  const required = ['package.json', 'vite.config.js', 'index.html', 'src/main.jsx', 'src/App.jsx', 'src/index.css'];
  for (const r of required) {
    if (!files[r]) errors.push(`Missing required file: ${r}`);
  }

  return errors;
}

async function main() {
  const key = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!key) {
    console.error('Missing VITE_GROQ_API_KEY or GROQ_API_KEY in .env');
    process.exit(1);
  }

  console.log('Testing generation with prompt:', TEST_PROMPT);
  console.log('Model: moonshotai/kimi-k2-instruct-0905\n');

  let result = '';
  try {
    await generateWithGroq(key, TEST_PROMPT, (chunk) => { result = chunk; });
  } catch (e) {
    console.error('Generation failed:', e.message);
    process.exit(1);
  }

  const project = extractNextProject(result);
  if (!project?.files) {
    console.error('No project extracted from output');
    console.log('Output length:', result.length);
    process.exit(1);
  }

  ensurePackageDependencies(project.files);

  const errors = validateProject(project);
  const fileCount = Object.keys(project.files).length;

  console.log('Generated', fileCount, 'files:', Object.keys(project.files).join(', '));

  if (errors.length > 0) {
    console.log('\n❌ Validation errors:');
    errors.forEach((e) => console.log('  -', e));
    process.exit(1);
  }

  console.log('\n✓ No validation errors');
  console.log('✓ Generation test passed');
}

main();
