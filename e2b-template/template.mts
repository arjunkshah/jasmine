/**
 * E2B Vite template for Jasmine — Node pre-installed, Vite + React
 *
 * Pre-installs Vite, React, Tailwind, @phosphor-icons/react.
 * sandbox.files.write() → hot-reload → instant preview. No npm install on each run.
 *
 * Build once: npm run e2b:build
 * Then set E2B_TEMPLATE_ID=jasmine-vite in Vercel env vars.
 */
import { Template, waitForURL } from 'e2b';

export const template = Template()
  .fromNodeImage('20-slim')
  .setWorkdir('/home/user')
  .runCmd('npm create vite@4 app -- --template react')
  .runCmd('cp -r app/. . && rm -rf app')
  .runCmd('npm install')
  .runCmd('npm install tailwindcss@3 postcss autoprefixer @phosphor-icons/react react-router-dom@6')
  .runCmd('npx tailwindcss init -p')
  .setStartCmd('npx vite --host --port 5173', waitForURL('http://localhost:5173'));
