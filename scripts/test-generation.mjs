#!/usr/bin/env node
/**
 * Test code generation — runs a prompt, validates, writes to temp dir, and runs build.
 * Run: npm run test:generate
 *       npm run test:generate:verbose   # show all generated code
 *       node scripts/test-generation.mjs --save=./out  # save to ./out and keep
 * Requires: VITE_GROQ_API_KEY or GROQ_API_KEY in .env
 */
import 'dotenv/config';
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { generateWithGroq, extractNextProject, ensurePackageDependencies } from '../src/api.js';

const TEST_PROMPT = 'Simple landing page: hero with one headline, one CTA button, and a footer. Dark theme, zinc colors.';
const VERBOSE = process.env.VERBOSE === '1' || process.argv.includes('--verbose');
const SAVE_DIR = process.argv.find((a) => a.startsWith('--save='))?.slice(7);

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
    const regex = new RegExp(importRegex.source, 'g');
    let m;
    while ((m = regex.exec(content)) !== null) {
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

  // 3. Syntax & style checks per file
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
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`${path}: unbalanced brackets [ ]`);
    }
    if (content.includes('dark-950') || content.includes('dark-900') || content.includes('dark-800')) {
      errors.push(`${path}: invalid Tailwind dark-* color (use zinc-950, slate-900)`);
    }
    if (/import\s*\{\s*[^}]*\bIcon\b[^}]*\}\s*from\s*['"]@phosphor-icons\/react['"]/.test(content)) {
      errors.push(`${path}: invalid Phosphor import - use CheckIcon, StarIcon etc, never Icon`);
    }
    if (content.includes('next/') || content.includes('next/link') || content.includes('next/image')) {
      errors.push(`${path}: Next.js import - use Vite + React only`);
    }
    // Unclosed style={{ 
    if ((content.match(/style=\{\{/g) || []).length !== (content.match(/\}\}/g) || []).length) {
      const opens = (content.match(/style=\{\{/g) || []).length;
      const closes = (content.match(/\}\}/g) || []).length;
      if (opens > closes) errors.push(`${path}: possible unclosed style={{ (${opens} open, ${closes} close)`);
    }
  }

  // 4. Required files
  const required = ['package.json', 'vite.config.js', 'index.html', 'src/main.jsx', 'src/App.jsx', 'src/index.css'];
  for (const r of required) {
    if (!files[r]) errors.push(`Missing required file: ${r}`);
  }

  return errors;
}

function printAllCode(files) {
  console.log('\n--- Generated code ---\n');
  for (const [path, content] of Object.entries(files)) {
    console.log(`\n### ${path} (${content.length} chars)\n`);
    console.log('```');
    console.log(content.slice(0, 2000) + (content.length > 2000 ? '\n... (truncated)' : ''));
    console.log('```');
  }
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

  if (VERBOSE) printAllCode(project.files);

  if (errors.length > 0) {
    console.log('\n❌ Static validation errors:');
    errors.forEach((e) => console.log('  -', e));
  }

  // Write to temp dir (or --save=path) and run build
  const tmpDir = SAVE_DIR || (await mkdtemp(join(tmpdir(), 'jasmine-test-')));
  if (SAVE_DIR) await mkdir(tmpDir, { recursive: true });
  try {
    for (const [path, content] of Object.entries(project.files)) {
      const fullPath = join(tmpDir, path);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, content);
    }
    console.log('\nBuilding project in', tmpDir, '...');
    execSync('npm install', { cwd: tmpDir, stdio: 'pipe' });
    const buildOutput = execSync('npm run build', { cwd: tmpDir, encoding: 'utf8', stdio: 'pipe' });
    if (VERBOSE) console.log('\nBuild output:', buildOutput);
    console.log('✓ Build succeeded');
  } catch (e) {
    const msg = e.stderr || e.stdout || e.message || String(e);
    console.log('\n❌ Build failed:');
    console.log(msg.slice(0, 2000));
    if (msg.length > 2000) console.log('... (truncated)');
    if (errors.length === 0) process.exit(1);
  } finally {
    if (!SAVE_DIR) await rm(tmpDir, { recursive: true, force: true });
    else console.log('Saved to', tmpDir);
  }

  if (errors.length > 0) {
    console.log('\n--- Summary ---');
    console.log('Static errors:', errors.length);
    console.log('Run with VERBOSE=1 to see all generated code');
    process.exit(1);
  }

  console.log('\n✓ No errors');
  console.log('✓ Generation test passed');
}

main();
