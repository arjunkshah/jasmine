import JSZip from 'jszip';

/**
 * Create and download a ZIP of the project files.
 * @param {{ files: Record<string, string> }} project - { files: { path: content } }
 * @param {string} fallbackRaw - Raw text when no parsed files (e.g. generatedHTML)
 */
export async function downloadProjectAsZip(project, fallbackRaw = '') {
  const zip = new JSZip();
  const files = project?.files && typeof project.files === 'object' ? project.files : {};

  if (Object.keys(files).length > 0) {
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, typeof content === 'string' ? content : String(content));
    }
  } else if (fallbackRaw?.trim()) {
    const raw = fallbackRaw.trim();
    zip.file('output.txt', raw);
    const pkg = {
      name: 'jasmine-app',
      version: '0.1.0',
      private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
    };
    zip.file('package.json', JSON.stringify(pkg, null, 2));
    zip.file('app/page.tsx', `export default function Page() {\n  return (\n    <main className="min-h-screen p-8">\n      <p className="text-zinc-600">Generated content saved to <code className="bg-zinc-100 px-1 rounded">output.txt</code> in the project root.</p>\n    </main>\n  );\n}\n`);
    zip.file('app/layout.tsx', `export const metadata = { title: 'Jasmine App' };\nexport default function RootLayout({ children }) { return <html lang="en"><body>{children}</body></html>; }\n`);
  } else {
    throw new Error('No project to download');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jasmine-project.zip';
  a.click();
  URL.revokeObjectURL(url);
}
