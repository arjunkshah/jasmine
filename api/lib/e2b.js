/** Shared E2B logic for Vercel serverless functions */

export const BOILERPLATE = {
  'package.json': JSON.stringify({
    name: 'jasmine-app',
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0', '@phosphor-icons/react': '^2.1.6', tailwindcss: '^3.4.0', postcss: '^8.4.0', autoprefixer: '^10.4.0' },
  }, null, 2),
  'next.config.mjs': `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`,
  'src/app/page.tsx': `export default function Page() {
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
`,
  'src/app/layout.tsx': `import './globals.css';
export const metadata = { title: 'Jasmine App' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  'tailwind.config.ts': `import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: {} }, plugins: [] };
export default config;
`,
  'postcss.config.mjs': `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
`,
};

export function checkE2B() {
  const key = process.env.E2B_API_KEY;
  if (!key) {
    console.warn('[e2b] E2B_API_KEY not set — sandbox endpoints will fail');
    return { error: 'E2B_API_KEY not set. Add it in Vercel Environment Variables. Get key at https://e2b.dev/dashboard' };
  }
  return null;
}
