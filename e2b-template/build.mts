/**
 * Build the Jasmine Next.js E2B template.
 * Run once: npx tsx e2b-template/build.mts
 *
 * Requires: E2B_API_KEY in .env
 * Get key: https://e2b.dev/dashboard
 */
import 'dotenv/config';
import { Template, defaultBuildLogger } from 'e2b';
import { template } from './template.mts';

const TEMPLATE_NAME = 'jasmine-vite';

async function main() {
  console.log(`Building E2B template "${TEMPLATE_NAME}"...`);
  await Template.build(template, TEMPLATE_NAME, {
    cpuCount: 4,
    memoryMB: 4096,
    onBuildLogs: defaultBuildLogger(),
  });
  console.log(`\nDone! Use Sandbox.create('${TEMPLATE_NAME}') to create sandboxes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
