/**
 * E2B Next.js template for Jasmine — per https://e2b.dev/docs/template/examples/nextjs
 *
 * Pre-installs Next.js 14, Tailwind, @phosphor-icons/react. Dev server starts automatically.
 * sandbox.files.write() → hot-reload → instant preview. No npm install or next build on each run.
 *
 * Build once: npm run e2b:build
 * Then set E2B_TEMPLATE_ID=jasmine-nextjs in Vercel env vars.
 */
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromNodeImage('21-slim')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --app'
  )
  .runCmd('npm install @phosphor-icons/react@^2.1.6')
  .runCmd('cp -r /home/user/nextjs-app/. /home/user/ && rm -rf /home/user/nextjs-app')
  .setWorkdir('/home/user')
  .setStartCmd('npx next dev --port 3000 --hostname 0.0.0.0', waitForURL('http://localhost:3000'));
