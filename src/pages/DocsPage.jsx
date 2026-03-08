import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BlurPopUpByWord from '../components/BlurPopUpByWord';
import BlurPopUpByWordInView from '../components/BlurPopUpByWordInView';
import BlurPopUpInView from '../components/BlurPopUpInView';
import HeroGlowLines from '../components/HeroGlowLines';
import DocsChat from '../components/DocsChat';

const SECTIONS = [
  { id: 'overview', title: 'Overview' },
  { id: 'getting-started', title: 'Getting started' },
  { id: 'prompts', title: 'Writing effective prompts' },
  { id: 'modes', title: 'Design modes' },
  { id: 'chat-edits', title: 'Chat & edits' },
  { id: 'models', title: 'Model selection' },
  { id: 'preview-deploy', title: 'Preview & deployment' },
  { id: 'slash-commands', title: 'Slash commands' },
  { id: 'tips', title: 'Tips & best practices' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
];

function DocsPage({ theme, onStartDesigning, onBackHome }) {
  const [activeSection, setActiveSection] = useState('overview');
  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white border border-zinc-200/70 card-3d' : 'bg-white/[0.02] border border-white/[0.06] card-3d';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const sectionCl = 'px-6 md:px-12 lg:px-24';
  const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
  const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
  const maxW = 'max-w-5xl mx-auto';
  const codeCl = isLight ? 'bg-zinc-100 text-zinc-800 border-zinc-200' : 'bg-white/[0.06] text-text-primary border-white/10';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveSection(e.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
              <BlurPopUpByWord text="how to use jasmine." wordDelay={0.05} />
            </h1>
            <p className={`text-base md:text-lg leading-[1.6] ${isLight ? 'text-text-secondary' : 'text-text-secondary [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'}`}>
              <BlurPopUpByWord text="step-by-step guide, prompt tips, chat edits, deployment, and best practices." wordDelay={0.025} />
            </p>
            <div className="flex flex-wrap gap-3 items-center">
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
        {/* Sidebar nav — compact */}
        <aside className={`hidden lg:block flex-shrink-0 w-48 ${sectionCl} pt-12`}>
          <nav className="sticky top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted mb-3">Contents</p>
            <div className="space-y-0.5">
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`block w-full text-left text-sm py-1.5 px-0 rounded transition-colors ${
                      isActive
                        ? 'text-jasmine-400 font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {s.title}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className={`flex-1 min-w-0 ${sectionCl} py-12 pb-24`}>
          {/* Mobile nav */}
          <div className="lg:hidden mb-8">
            <details className={`group rounded-xl ${isLight ? 'bg-white/80 border border-zinc-200/80' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
              <summary className="px-4 py-3 cursor-pointer font-medium text-text-primary flex items-center justify-between list-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <i className="ph ph-list text-text-muted" />
                  On this page
                </span>
                <i className="ph ph-caret-down transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-2 pb-3 pt-1 space-y-0.5 max-h-64 overflow-y-auto">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={(e) => {
                      scrollToSection(s.id);
                      e.currentTarget.closest('details')?.removeAttribute('open');
                    }}
                    className={`flex items-center gap-2 w-full text-left text-sm py-2 px-3 rounded-lg ${activeSection === s.id ? 'bg-jasmine-400/15 text-jasmine-400' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div className={`${maxW} space-y-16`}>
            {/* Overview */}
            <section id="overview" className="scroll-mt-24">
              <h2 className={headingCl}>Overview</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Jasmine turns natural language into production-ready frontends. Describe what you want — a landing page, SaaS dashboard, portfolio — and Jasmine generates the full project with structure, styling, and polish. No coding required.
              </p>
              <p className="text-text-secondary leading-relaxed">
                Choose <strong>Vite+React</strong> for full projects you can integrate with a backend, or <strong>HTML</strong> for rapid prototyping with instant preview. Use the chat to refine: change colors, add sections, fix copy. Deploy to Netlify, push to GitHub, or download as ZIP.
              </p>
            </section>

            {/* Getting started */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className={headingCl}>Getting started</h2>
              <ol className="list-decimal list-inside space-y-4 text-text-secondary leading-relaxed">
                <li><strong>Enter a prompt</strong> — Describe your app in plain English. Example: &quot;A meditation app with a timer, calming gradients, and breathing exercises.&quot;</li>
                <li><strong>Pick a mode</strong> — Toggle <strong>Vite+React</strong> (full project) or <strong>HTML</strong> (simple, instant preview) in the designer.</li>
                <li><strong>Click Generate</strong> — Code streams in real time. Watch the Files tab populate as the AI builds.</li>
                <li><strong>Preview</strong> — The live preview loads in the right panel. First load can take 30–60 seconds while the sandbox starts.</li>
                <li><strong>Refine in chat</strong> — Ask for changes: &quot;make the header black&quot;, &quot;add a pricing section&quot;, &quot;update the hero text&quot;.</li>
                <li><strong>Deploy or download</strong> — Use the Deploy button for Netlify, Push to GitHub, or Download as ZIP.</li>
              </ol>
              <p className="text-text-secondary mt-4">
                <strong>Tip:</strong> Sign in with Google or email to save projects and enable auto-save.
              </p>
            </section>

            {/* Writing effective prompts */}
            <section id="prompts" className="scroll-mt-24">
              <h2 className={headingCl}>Writing effective prompts</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Better prompts = better output. Be specific about the product, audience, and feel.
              </p>
              <div className={`${cardCl} p-5 rounded-xl mb-6`}>
                <h4 className="font-semibold text-text-primary mb-3">What to include</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li><strong>Product type</strong> — e.g. law firm, SaaS, restaurant, portfolio, agency</li>
                  <li><strong>Key sections</strong> — hero, features, pricing, testimonials, contact, etc.</li>
                  <li><strong>Visual direction</strong> — &quot;dark and minimal&quot;, &quot;warm and inviting&quot;, &quot;professional blue&quot;</li>
                  <li><strong>Specific features</strong> — &quot;with a pricing table&quot;, &quot;team member cards with photos&quot;, &quot;FAQ accordion&quot;</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Good examples</h4>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li>&quot;A law firm landing page: hero with tagline, practice areas grid, attorney bios, contact form. Professional, trustworthy, navy and gold.&quot;</li>
                    <li>&quot;SaaS product page for a project management tool. Hero, feature comparison, testimonials, pricing tiers, CTA. Clean, modern, blue accent.&quot;</li>
                    <li>&quot;Restaurant website: hero with food imagery, menu highlights, reservation CTA, location. Warm, appetizing, dark wood aesthetic.&quot;</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-2">Tips</h4>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                    <li>Start broad, then refine in chat. Don&apos;t try to specify everything in the first prompt.</li>
                    <li>Mention the industry or use case — it helps the AI infer imagery and tone.</li>
                    <li>For images: say &quot;add a hero image&quot; or &quot;team photos&quot; — the AI will use placeholders that get auto-generated.</li>
                    <li>Avoid vague requests like &quot;make it look good&quot;. Be concrete: &quot;use a darker header&quot;, &quot;add more spacing between sections&quot;.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Design modes */}
            <section id="modes" className="scroll-mt-24">
              <h2 className={headingCl}>Design modes</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className={`${cardCl} p-6 rounded-xl`}>
                  <h4 className="font-semibold text-text-primary mb-2">Vite + React</h4>
                  <p className="text-sm text-text-secondary mb-3">Full project with components, Tailwind, and a build step. Best for production apps you&apos;ll extend or connect to a backend.</p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Components (Header, Hero, Footer, etc.)</li>
                    <li>• Live preview in cloud sandbox</li>
                    <li>• Download as full project</li>
                    <li>• Deploy to Netlify</li>
                  </ul>
                </div>
                <div className={`${cardCl} p-6 rounded-xl`}>
                  <h4 className="font-semibold text-text-primary mb-2">HTML</h4>
                  <p className="text-sm text-text-secondary mb-3">Plain HTML, CSS, and JavaScript. No build step. Preview loads instantly in the browser.</p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• index.html, styles.css, script.js</li>
                    <li>• Instant iframe preview</li>
                    <li>• Great for quick mockups</li>
                    <li>• No sandbox needed</li>
                  </ul>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-4">
                <strong>Tip:</strong> Use HTML mode for fast iteration; switch to Vite+React when you need a real project structure.
              </p>
            </section>

            {/* Chat & edits */}
            <section id="chat-edits" className="scroll-mt-24">
              <h2 className={headingCl}>Chat & edits</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                After generating, use the chat to refine. The AI applies targeted edits — it won&apos;t rewrite entire files for small changes.
              </p>
              <div className={`${cardCl} p-5 rounded-xl mb-6`}>
                <h4 className="font-semibold text-text-primary mb-3">What works well</h4>
                <ul className="space-y-2 text-text-secondary text-sm">
                  <li><strong>Style changes:</strong> &quot;make the header black&quot;, &quot;change the CTA to green&quot;, &quot;use a darker background&quot;</li>
                  <li><strong>Text updates:</strong> &quot;update the hero headline to X&quot;, &quot;change the tagline&quot;</li>
                  <li><strong>Additions:</strong> &quot;add a pricing section&quot;, &quot;add a testimonials carousel&quot;, &quot;add a newsletter signup in the footer&quot;</li>
                  <li><strong>Removals:</strong> &quot;remove the FAQ section&quot;, &quot;simplify the hero&quot;</li>
                </ul>
              </div>
              <p className="text-text-secondary text-sm">
                <strong>Tip:</strong> Be specific. &quot;Change the header to black&quot; is better than &quot;make it darker&quot;. For complex changes, break them into multiple chat messages.
              </p>
            </section>

            {/* Model selection */}
            <section id="models" className="scroll-mt-24">
              <h2 className={headingCl}>Model selection</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Use the model dropdown in the designer to choose your AI provider. Each has different strengths and rate limits.
              </p>
              <div className={`${cardCl} overflow-hidden rounded-xl`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isLight ? 'bg-zinc-50 border-b border-zinc-200' : 'bg-white/[0.04] border-b border-white/10'}>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Model</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Best for</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">Gemini (direct)</td><td className="py-2.5 px-4 text-text-secondary">Default. Good balance of speed and quality. Requires VITE_GEMINI_API_KEY.</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">Gemini 3 Flash (gateway)</td><td className="py-2.5 px-4 text-text-secondary">Via AI Gateway. Uses server-side key.</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">Kimi K2.5</td><td className="py-2.5 px-4 text-text-secondary">Fast. Requires VITE_GROQ_API_KEY.</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">GPT 5.4</td><td className="py-2.5 px-4 text-text-secondary">Via AI Gateway. Uses server-side key.</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Preview & deployment */}
            <section id="preview-deploy" className="scroll-mt-24">
              <h2 className={headingCl}>Preview & deployment</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                <strong>Preview:</strong> Vite+React projects run in a cloud sandbox. The first load can take 30–60 seconds. HTML mode previews instantly in an iframe. Use the Files tab to browse generated code; click a file to view it.
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                <strong>Deploy:</strong> One-click deploy to Netlify (requires NETLIFY_AUTH_TOKEN). Push to GitHub to create a repo and push your code (requires GITHUB_TOKEN). Or download as ZIP for local development.
              </p>
              <p className="text-text-secondary text-sm">
                <strong>Tip:</strong> If the preview fails to load, wait a minute and try again. Sandbox startup can be slow under load.
              </p>
            </section>

            {/* Slash commands */}
            <section id="slash-commands" className="scroll-mt-24">
              <h2 className={headingCl}>Slash commands</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Type these in chat or let the AI invoke them. The AI often runs <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/create-and-apply</code>, <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/fix-errors</code>, and <code className={codeCl + ' px-1.5 py-0.5 rounded text-xs'}>/apply</code> automatically after generation.
              </p>
              <div className={`${cardCl} overflow-hidden rounded-xl`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={isLight ? 'bg-zinc-50 border-b border-zinc-200' : 'bg-white/[0.04] border-b border-white/10'}>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Command</th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/create-and-apply</td><td className="py-2.5 px-4 text-text-secondary">Create sandbox (if needed) and apply code to preview</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/apply</td><td className="py-2.5 px-4 text-text-secondary">Apply current code to the preview sandbox</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/fix-errors</td><td className="py-2.5 px-4 text-text-secondary">Run AI fix pass (imports, Tailwind, icons)</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/deploy</td><td className="py-2.5 px-4 text-text-secondary">Deploy to Netlify</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/netlify-deploy</td><td className="py-2.5 px-4 text-text-secondary">Same as /deploy</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/download</td><td className="py-2.5 px-4 text-text-secondary">Download project as ZIP</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/web-search &lt;query&gt;</td><td className="py-2.5 px-4 text-text-secondary">Search the web for context (design trends, etc.)</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/generate-image &lt;prompt&gt;</td><td className="py-2.5 px-4 text-text-secondary">Generate an image from a text prompt</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/retry</td><td className="py-2.5 px-4 text-text-secondary">Retry applying code if preview failed</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/open-preview</td><td className="py-2.5 px-4 text-text-secondary">Open preview in a new tab</td></tr>
                    <tr><td className="py-2.5 px-4 font-mono text-jasmine-400">/list-files</td><td className="py-2.5 px-4 text-text-secondary">List generated files in chat</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tips & best practices */}
            <section id="tips" className="scroll-mt-24">
              <h2 className={headingCl}>Tips & best practices</h2>
              <ul className="space-y-3 text-text-secondary">
                <li><strong>Start simple, iterate.</strong> Generate a basic version first, then refine in chat. Don&apos;t overload the initial prompt.</li>
                <li><strong>Use context files.</strong> Attach a .txt or .md with brand guidelines, copy, or structure. The AI uses it as reference.</li>
                <li><strong>Sign in to save.</strong> Projects auto-save when you&apos;re signed in. Load from the sidebar anytime.</li>
                <li><strong>Small edits = faster.</strong> &quot;Change the header to black&quot; applies a targeted edit. &quot;Rebuild the whole site&quot; regenerates everything.</li>
                <li><strong>If the preview breaks,</strong> try <code className={codeCl + ' px-1 py-0.5 rounded text-xs'}>/fix-errors</code> in chat. The AI will repair imports and common issues.</li>
                <li><strong>HTML mode for speed.</strong> When you need a quick mockup, HTML mode skips the sandbox and previews instantly.</li>
                <li><strong>Share projects.</strong> Sign in, then use Share to invite collaborators by email. They&apos;ll need to sign in to view.</li>
              </ul>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="scroll-mt-24">
              <h2 className={headingCl}>Troubleshooting</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Preview not loading</h4>
                  <p className="text-text-secondary text-sm">Wait 30–60 seconds for the sandbox to start. If it still fails, try generating again or use <code className={codeCl + ' px-1 py-0.5 rounded text-xs'}>/retry</code> in chat.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Build errors / broken preview</h4>
                  <p className="text-text-secondary text-sm">Type <code className={codeCl + ' px-1 py-0.5 rounded text-xs'}>/fix-errors</code> in chat. The AI will repair phantom imports, Tailwind issues, and icon errors.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">AI not responding / rate limit</h4>
                  <p className="text-text-secondary text-sm">Try a different model (e.g. Gemini if Kimi is rate-limited). Ensure your API key is set for the selected model.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Project won&apos;t save</h4>
                  <p className="text-text-secondary text-sm">Sign in with Google or email. Projects only save when you&apos;re authenticated.</p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Chatbot — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-40">
        <DocsChat theme={theme} />
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
