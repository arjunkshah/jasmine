/**
 * E2B boilerplate — open-lovable style: Vite + React (no Next.js build)
 * @see https://github.com/firecrawl/open-lovable
 * Port 5173, npm run dev → instant hot-reload. No build step = faster, fewer timeouts.
 */

const SHARED_FILES = {
  'package.json': JSON.stringify({
    name: 'jasmine-app',
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: { dev: 'vite --host', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      '@phosphor-icons/react': '^2.1.6',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.0.0',
      vite: '^4.3.9',
      tailwindcss: '^3.3.0',
      postcss: '^8.4.31',
      autoprefixer: '^10.4.16',
    },
  }, null, 2),
  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false,
    allowedHosts: ['.e2b.app', '.e2b.dev', '.vercel.run', 'localhost', '127.0.0.1']
  }
})
`,
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
`,
  'postcss.config.js': `export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
`,
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jasmine App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
};

const PAGE_LIGHT = `export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
          <span className="text-2xl">✦</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-zinc-900">Building your project</h1>
        <p className="text-sm text-zinc-500 mt-2">Jasmine is crafting your site. Preview will update when ready.</p>
      </div>
    </main>
  );
}
`;

const PAGE_DARK = `export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
          <span className="text-2xl">✦</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-zinc-100">Building your project</h1>
        <p className="text-sm text-zinc-500 mt-2">Jasmine is crafting your site. Preview will update when ready.</p>
      </div>
    </main>
  );
}
`;

/** @param {'light'|'dark'} theme */
export function getBoilerplate(theme = 'dark') {
  const page = theme === 'light' ? PAGE_LIGHT : PAGE_DARK;
  return {
    ...SHARED_FILES,
    'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
    'src/App.jsx': page,
    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  };
}

/** @deprecated Use getBoilerplate(theme) */
export const BOILERPLATE = getBoilerplate('dark');

export function checkE2B() {
  const key = process.env.E2B_API_KEY;
  if (!key) {
    console.warn('[e2b] E2B_API_KEY not set — sandbox endpoints will fail');
    return { error: 'E2B_API_KEY not set. Add it in Vercel Environment Variables. Get key at https://e2b.dev/dashboard' };
  }
  return null;
}
