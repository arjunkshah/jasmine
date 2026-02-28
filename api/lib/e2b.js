/** Shared E2B logic for Vercel serverless functions */

export const BOILERPLATE = {
  'package.json': JSON.stringify({
    name: 'jasmine-app',
    version: '0.1.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
  }, null, 2),
  'app/page.tsx': `export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-100">
      <div className="text-center">
        <p className="text-lg opacity-80">Generating your project...</p>
        <p className="text-sm text-zinc-500 mt-2">Code will appear as it streams</p>
      </div>
    </main>
  );
}
`,
  'app/layout.tsx': `export const metadata = { title: 'Jasmine App' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
};

export function checkE2B() {
  const key = process.env.E2B_API_KEY;
  if (!key) {
    return { error: 'E2B_API_KEY not set. Add it in Vercel Environment Variables. Get key at https://e2b.dev/dashboard' };
  }
  return null;
}
