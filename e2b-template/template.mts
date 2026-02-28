/**
 * E2B Next.js template for Jasmine — per https://e2b.dev/docs/template/examples/nextjs
 *
 * Pre-installs Next.js and starts the dev server automatically.
 * When you sandbox.files.write() generated code, it hot-reloads instantly.
 *
 * Build once: npx tsx e2b-template/build.mts
 * Then use: Sandbox.create('jasmine-nextjs')
 */
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromNodeImage('21-slim')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx create-next-app@14.2.30 . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-src-dir'
  )
  .runCmd('cp -r /home/user/nextjs-app/. /home/user/ && rm -rf /home/user/nextjs-app')
  .setWorkdir('/home/user')
  .setStartCmd('npx next dev --port 3000 --hostname 0.0.0.0', waitForURL('http://localhost:3000'));
