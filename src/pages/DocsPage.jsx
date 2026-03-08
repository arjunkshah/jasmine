import { motion } from 'framer-motion';
import BlurPopUpByWord from '../components/BlurPopUpByWord';
import BlurPopUpByWordInView from '../components/BlurPopUpByWordInView';
import BlurPopUpInView from '../components/BlurPopUpInView';
import HeroGlowLines from '../components/HeroGlowLines';

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'generation', title: 'Generation flow' },
  { id: 'edit', title: 'Edit flow' },
  { id: 'preview', title: 'Preview & E2B' },
  { id: 'output-format', title: 'Output format' },
  { id: 'error-prevention', title: 'Error prevention' },
  { id: 'tech-stack', title: 'Tech stack' },
  { id: 'auth', title: 'Auth & projects' },
  { id: 'deploy', title: 'Deployment' },
];

function DocsPage({ theme, onStartDesigning, onBackHome }) {
  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white border border-zinc-200/70 card-3d' : 'bg-white/[0.02] border border-white/[0.06] card-3d';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const sectionCl = 'px-6 md:px-12 lg:px-24';
  const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
  const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
  const maxW = 'max-w-5xl mx-auto';
  const codeCl = isLight ? 'bg-zinc-100 text-zinc-800 border-zinc-200' : 'bg-white/[0.06] text-text-primary border-white/10';

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <section className={`relative min-h-[50vh] flex items-center ${sectionCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/hero-bg.png')` }} />
        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-b from-white via-white/80 to-white' : 'bg-gradient-to-b from-black/40 via-surface/70 to-surface'}`} />
        <HeroGlowLines />
        <div className={`${maxW} relative w-full`}>
          <div className="flex flex-col gap-6 max-w-3xl">
            <p className={`${labelCl} font-display text-3d`}>
              <BlurPopUpByWord text="documentation" wordDelay={0.02} />
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-text-primary font-display text-3d">
              <BlurPopUpByWord text="how jasmine is built." wordDelay={0.05} />
            </h1>
            <p className={`text-base md:text-lg leading-[1.6] ${isLight ? 'text-text-secondary' : 'text-text-secondary [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'}`}>
              <BlurPopUpByWord text="architecture, generation flow, preview sandbox, and deployment. technical deep-dive for developers." wordDelay={0.025} />
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 text-sm px-8 py-3">
                <i className="ph ph-rocket-launch text-base"></i>
                try jasmine
              </button>
              <button onClick={onBackHome} className={`${cardCl} px-5 py-3 rounded-lg text-sm font-medium text-text-primary flex items-center gap-2`}>
                <i className="ph ph-arrow-left"></i>
                back to overview
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex lg:flex-row gap-12">
        {/* Sidebar nav */}
        <aside className={`hidden lg:block flex-shrink-0 w-56 ${sectionCl} pt-12`}>
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted mb-4">Contents</p>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="block w-full text-left text-sm py-2 px-3 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className={`flex-1 min-w-0 ${sectionCl} py-12 pb-24`}>
          <div className={`${maxW} space-y-16`}>
            {/* Overview */}
            <section id="overview" className="scroll-mt-24">
              <h2 className={headingCl}>Overview</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Jasmine is an AI-powered design notebook that turns natural language prompts into full, production-ready frontends. It combines multiple AI providers (Groq/Kimi, Gemini, OpenAI) with a design-first workflow: the system analyzes your prompt, breaks it into sections, identifies audience and goals, designs the frontend structure, and only then generates code.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Two output modes: <strong>Vite+React</strong> for full projects (integratable with your backend) and <strong>HTML</strong> for rapid prototyping. Live preview runs in E2B cloud sandboxes — no local build required. Chat-based edits apply changes in real time.
              </p>
            </section>

            {/* Architecture */}
            <section id="architecture" className="scroll-mt-24">
              <h2 className={headingCl}>Architecture</h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                Jasmine is a Vite + React frontend with serverless API routes (Vercel). The frontend handles UI, streaming, and project parsing; the API handles AI calls, E2B sandbox management, and deployment.
              </p>
              <div className={`${cardCl} p-6 rounded-lg overflow-x-auto`}>
                <pre className={`text-sm font-mono p-4 rounded-lg ${codeCl} border`}>{`Jasmine/
├── src/                    # Frontend (React + Vite)
│   ├── App.jsx             # Main app, routing, designer UI
│   ├── api.js              # API client, project parsing (extractNextProject, etc.)
│   ├── systemPrompt.js     # AI prompts (Vite+React, HTML, edit modes)
│   ├── pages/              # LandingPage, BlogPage, DocsPage
│   ├── components/         # Reusable UI
│   └── lib/                # firebase, analytics, projects, waitlist
├── api/                    # Serverless routes (Vercel)
│   ├── ai.js               # Unified generate + edit
│   ├── fix-errors.js       # AI-powered error fixing
│   ├── generate-image.js   # Image generation
│   ├── sandbox/start.js    # E2B sandbox creation
│   ├── sandbox/update.js   # E2B file push, hot-reload
│   └── deploy.js           # Netlify deploy
├── lib/                    # Server utilities
│   ├── chat.js             # Non-streaming AI (Gateway)
│   └── sandbox/            # E2B config, boilerplate
└── e2b-template/           # E2B template build`}</pre>
              </div>
            </section>

            {/* Generation flow */}
            <section id="generation" className="scroll-mt-24">
              <h2 className={headingCl}>Generation flow</h2>
              <ol className="list-decimal list-inside space-y-4 text-text-secondary leading-relaxed">
                <li><strong>User prompt</strong> → <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>generate()</code> in App.jsx calls <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>generateWithGateway</code> / <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>generateWithGroq</code> / <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>generateWithGemini</code> in api.js</li>
                <li><strong>AI streams</strong> → <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>extractNextProject()</code> parses <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>---FILE:path---</code> blocks in real time</li>
                <li><strong>Repair</strong> → <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>fixUnterminatedStringsInContent()</code> repairs truncated imports and literals</li>
                <li><strong>Fix pass</strong> (optional) → <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/fix-errors</code> — alternate model reviews and fixes phantom imports, Tailwind, Phosphor icons</li>
                <li><strong>Preview</strong> → <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/sandbox/update</code> pushes files to E2B → Vite hot-reload</li>
              </ol>
            </section>

            {/* Edit flow */}
            <section id="edit" className="scroll-mt-24">
              <h2 className={headingCl}>Edit flow</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Chat messages are sent to the edit API with the current project state. The AI returns a diff (changed files only) in the same <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>---FILE:path---</code> format. The frontend merges edits into the project and pushes to the sandbox.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Slash commands parsed from AI output: <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/apply</code>, <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/fix-errors</code>, <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/create-and-apply</code>. Each handler in App.jsx calls the relevant API.
              </p>
            </section>

            {/* Preview & E2B */}
            <section id="preview" className="scroll-mt-24">
              <h2 className={headingCl}>Preview & E2B</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Live preview runs in <strong>E2B</strong> cloud sandboxes. No local Node/npm required. <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/sandbox/start</code> creates a sandbox; <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/sandbox/update</code> writes files and runs <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>npm install</code> + <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>npx vite</code>. File writes trigger hot-reload.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Config: <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>lib/sandbox/sandbox-config.js</code> — port, startup delay, poll attempts. Optional <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>E2B_TEMPLATE_ID</code> for custom pre-built templates.
              </p>
            </section>

            {/* Output format */}
            <section id="output-format" className="scroll-mt-24">
              <h2 className={headingCl}>Output format</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                AI outputs files in <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>---FILE:path---</code> blocks. Each block: header line, then code. Output order matters: pages/components before App.jsx to avoid phantom imports.
              </p>
              <div className={`${cardCl} p-4 rounded-lg font-mono text-sm ${codeCl} border`}>
                <pre>{`---FILE:src/pages/Home.jsx---
\`\`\`jsx
export default function Home() { ... }
\`\`\`

---FILE:src/App.jsx---
\`\`\`jsx
import Home from './pages/Home';
...
\`\`\``}</pre>
              </div>
            </section>

            {/* Error prevention */}
            <section id="error-prevention" className="scroll-mt-24">
              <h2 className={headingCl}>Error prevention</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Models: Groq (Kimi K2), Gemini 3 Flash, OpenAI. Temperature 0.5. Post-generation fix pass uses the <em>other</em> model to repair: unterminated literals, missing deps, phantom imports, Tailwind/Phosphor errors.
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong>Phantom imports</strong> — every import must have a corresponding file; output order enforces this</li>
                <li><strong>Tailwind</strong> — zinc, slate, gray allowed; dark-950/900 banned</li>
                <li><strong>Phosphor icons</strong> — named imports only, never generic Icon</li>
                <li><strong>package.json</strong> — ensurePackageDependencies() patches client- and server-side</li>
              </ul>
            </section>

            {/* Tech stack */}
            <section id="tech-stack" className="scroll-mt-24">
              <h2 className={headingCl}>Tech stack</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`${cardCl} p-5 rounded-lg`}>
                  <h4 className="font-semibold text-text-primary mb-2">Frontend</h4>
                  <p className="text-sm text-text-secondary">React 19, Vite 7, Framer Motion, Tailwind 4, Phosphor Icons</p>
                </div>
                <div className={`${cardCl} p-5 rounded-lg`}>
                  <h4 className="font-semibold text-text-primary mb-2">Backend</h4>
                  <p className="text-sm text-text-secondary">Vercel serverless, Firebase (Auth, Firestore), E2B sandboxes</p>
                </div>
                <div className={`${cardCl} p-5 rounded-lg`}>
                  <h4 className="font-semibold text-text-primary mb-2">AI</h4>
                  <p className="text-sm text-text-secondary">Groq (Kimi K2), Google Gemini, OpenAI. Streaming via fetch + ReadableStream</p>
                </div>
                <div className={`${cardCl} p-5 rounded-lg`}>
                  <h4 className="font-semibold text-text-primary mb-2">Deploy</h4>
                  <p className="text-sm text-text-secondary">Netlify (one-click), GitHub push, ZIP download</p>
                </div>
              </div>
            </section>

            {/* Auth & projects */}
            <section id="auth" className="scroll-mt-24">
              <h2 className={headingCl}>Auth & projects</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Firebase Auth: email/password + Google sign-in. Firestore stores projects (userId, name, prompt, files, chatMessages). Projects are private; sharing uses <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>sharedWith</code> email list. Auto-save when signed in.
              </p>
            </section>

            {/* Deployment */}
            <section id="deploy" className="scroll-mt-24">
              <h2 className={headingCl}>Deployment</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                <strong>Netlify</strong> — one-click from the app. <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/netlify/deploy</code> creates a site from the project ZIP. <strong>GitHub</strong> — <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/api/github/push</code> creates a repo and pushes. <strong>ZIP</strong> — client-side JSZip export.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* CTA */}
      <section className={`${sectionCl} py-24 border-t ${borderCl}`}>
        <BlurPopUpInView className={`${maxW} text-center`}>
          <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-4 font-display text-3d">
            <BlurPopUpByWordInView text="ready to build?" />
          </h2>
          <p className="text-base text-text-secondary max-w-2xl mx-auto mb-10">
            <BlurPopUpByWordInView text="launch jasmine and generate a full frontend in seconds." wordDelay={0.025} />
          </p>
          <button onClick={onStartDesigning} className="btn-premium px-8 py-3 text-sm flex items-center gap-2 mx-auto">
            <i className="ph ph-rocket-launch text-base"></i>
            start designing
          </button>
        </BlurPopUpInView>
      </section>
    </div>
  );
}

export default DocsPage;
