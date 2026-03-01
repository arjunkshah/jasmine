import JSZip from 'jszip';

/** Paths that belong to the Jasmine tool, not generated projects. Exclude these. */
const JASMINE_TOOL_PATHS = [
  /^api\//, /^server\//, /^docs\//, /^e2b-template\//, /^scripts\//, /^patches\//,
  /vite-plugin-api/, /systemPrompt/, /downloadZip\.js$/,
];

function isJasmineToolPath(path) {
  if (!path || typeof path !== 'string') return false;
  return JASMINE_TOOL_PATHS.some((re) => re.test(path));
}

/**
 * Create and download a ZIP of the project files.
 * @param {{ files: Record<string, string> }} project - { files: { path: content } }
 * @param {string} fallbackRaw - Raw text when no parsed files (e.g. generatedHTML)
 */
export async function downloadProjectAsZip(project, fallbackRaw = '') {
  const zip = new JSZip();
  let files = project?.files && typeof project.files === 'object' ? project.files : {};

  // Filter out Jasmine tool paths — only package generated project files
  files = Object.fromEntries(
    Object.entries(files).filter(([path]) => !isJasmineToolPath(path))
  );

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
      type: 'module',
      scripts: { dev: 'vite --host', build: 'vite build', preview: 'vite preview' },
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
      devDependencies: { '@vitejs/plugin-react': '^4.0.0', vite: '^4.3.9', tailwindcss: '^3.3.0', postcss: '^8.4.31', autoprefixer: '^10.4.16' },
    };
    zip.file('package.json', JSON.stringify(pkg, null, 2));
    zip.file('index.html', `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Jasmine App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`);
    zip.file('src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
`);
    zip.file('src/App.jsx', `export default function App() {
  return (
    <main className="min-h-screen p-8">
      <p className="text-zinc-600">Generated content saved to <code className="bg-zinc-100 px-1 rounded">output.txt</code> in the project root.</p>
    </main>
  );
}
`);
    zip.file('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
`);
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
