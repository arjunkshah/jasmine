/**
 * Build the Jasmine E2B template.
 * Run once: npm run e2b:build
 *
 * Requires: E2B_API_KEY in .env
 * Get key: https://e2b.dev/dashboard
 */
const TEMPLATE_NAME = 'jasmine-vite';

async function main() {
  await import('dotenv/config');
  console.log('Starting E2B template build...');

  const apiKey = process.env.E2B_API_KEY?.trim();
  if (!apiKey) {
    console.error('Error: E2B_API_KEY is required. Add it to .env or run: E2B_API_KEY=your_key npm run e2b:build');
    process.exit(1);
  }

  console.log('Loading E2B SDK...');
  const { Template, defaultBuildLogger } = await import('e2b');
  const { template } = await import('./template.mts');

  console.log(`Building "${TEMPLATE_NAME}"... (5–15 min)`);
  const start = Date.now();

  await Template.build(template, TEMPLATE_NAME, {
    cpuCount: 4,
    memoryMB: 4096,
    onBuildLogs: defaultBuildLogger(),
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\nDone in ${elapsed}s! Use Sandbox.create('${TEMPLATE_NAME}') to create sandboxes.`);
}

main().catch((e) => {
  console.error('Build failed:', e?.message || e);
  process.exit(1);
});
