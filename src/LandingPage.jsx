import { useEffect, useRef, useState } from 'react';

const PARTNER_LOGOS = [
  { name: 'Voxel Labs' },
  { name: 'Warpspeed' },
  { name: 'Mastermail' },
  { name: 'Leapyear' },
  { name: 'Lightspeed' },
];

const EXAMPLE_CARDS = [
  { label: 'Law firm', prompt: 'Complete law firm website — home, about, practice areas grid, team bios, contact page. Trustworthy, Lora serif, navy and gold. Every page, every section, every animation.', icon: 'ph-buildings' },
  { label: 'SaaS', prompt: 'Complete SaaS site for a dev tool — landing, features, pricing, docs, dashboard. Dark mode, Vercel-inspired, Space Grotesk. Every page, every section, every animation.', icon: 'ph-rocket-launch' },
  { label: 'Restaurant', prompt: 'Complete restaurant website — home, full menu, reservations, about, contact. Warm, appetizing, DM Sans. Every page, every section, every animation.', icon: 'ph-fork-knife' },
  { label: 'Gaming studio', prompt: 'Complete gaming studio site — home, games showcase, team, careers, contact. Bold gradients, Overused Grotesk. Every page, every section, every animation.', icon: 'ph-game-controller' },
  { label: 'Meditation app', prompt: 'Complete meditation app site — landing, features, testimonial carousel, pricing, download CTA. Soft, calming, Lora serif. Every page, every section, every animation.', icon: 'ph-leaf' },
  { label: 'Creative agency', prompt: 'Complete creative agency portfolio — home, case studies, about, services, contact. Dark editorial, asymmetric grid. Every page, every section, every animation.', icon: 'ph-palette' },
];

const FEATURES = [
  { title: 'Full Next.js Projects', description: 'Not snippets. Complete apps with src/, TypeScript, Tailwind. Every page, every section, every animation.', icon: 'ph-stack' },
  { title: 'Edit in Natural Language', description: 'Chat to refine. "Make the header darker" or "Add a pricing section" — targeted edits, not full regens.', icon: 'ph-chat-circle-dots' },
  { title: 'Production-Ready Output', description: 'Phosphor icons, Figtree typography, blur-reveal animations. Anti-AI-slop design system built in.', icon: 'ph-sparkle' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Describe it', desc: 'One prompt. What you want, the vibe, the pages.', icon: 'ph-pencil-simple' },
  { step: 2, title: 'Generate', desc: 'Jasmine crafts a full Next.js project. Streams code in real time.', icon: 'ph-magic-wand' },
  { step: 3, title: 'Edit & deploy', desc: 'Chat to tweak. Deploy to E2B. Download the code.', icon: 'ph-rocket-launch' },
];

const STATS = [
  { value: '45', label: 'Days of management saved per year' },
  { value: '10K+', label: 'Designers building better products' },
  { value: '100%', label: 'Production-ready output' },
];

const FAQ = [
  { q: 'What do I need?', a: 'A Groq or Gemini API key. Add it to .env and you\'re set.' },
  { q: 'What gets generated?', a: 'A complete Next.js 14+ project: layout, pages, components, Tailwind, TypeScript. Every file.' },
  { q: 'Can I edit the output?', a: 'Yes. Use the chat to request changes. Jasmine applies targeted edits, not full regens.' },
  { q: 'Is it free?', a: 'Jasmine is free. You pay for API usage (Groq/Gemini) based on your own keys.' },
];

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold, rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const [heroRef, heroVisible] = useScrollReveal(0.02);
  const [statsRef, statsVisible] = useScrollReveal(0.1);
  const [featuresRef, featuresVisible] = useScrollReveal(0.08);
  const [howRef, howVisible] = useScrollReveal(0.08);
  const [cardsRef, cardsVisible] = useScrollReveal(0.05);
  const [testimonialRef, testimonialVisible] = useScrollReveal(0.1);
  const [faqRef, faqVisible] = useScrollReveal(0.08);
  const [ctaRef, ctaVisible] = useScrollReveal(0.1);
  const [logosRef, logosVisible] = useScrollReveal(0.1);

  const isLight = theme === 'light';

  const reveal = (v, delay = 0) =>
    `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`;

  return (
    <div className="flex-1 overflow-y-auto landing-bg">
      <div className="relative z-10">
        {/* ——— HERO ——— */}
        <section ref={heroRef} className="relative min-h-[92vh] flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-20 pb-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-[1fr,1.1fr] gap-16 lg:gap-24 items-center">
              {/* Left: Copy */}
              <div className={`hero-reveal ${heroVisible ? 'visible' : ''}`}>
                <p className={`text-xs font-semibold tracking-[0.2em] uppercase mb-8 ${isLight ? 'text-zinc-500' : 'text-white/50'}`}>
                  Trusted by 10,000+ designers building better products
                </p>
                <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-text-primary mb-8">
                  Your Ideas Deserve Better Frontends.
                </h1>
                <p className="text-lg md:text-xl text-text-secondary leading-[1.5] max-w-xl mb-12 tracking-[-0.01em]">
                  Describe the website you want. Jasmine crafts a full Next.js project — every page, every section, every animation. Pixel-perfect. Production-ready.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                  <button
                    onClick={onStartDesigning}
                    className="btn-premium flex items-center gap-2 justify-center px-10 py-4"
                  >
                    <i className="ph ph-magic-wand text-xl"></i>
                    Start designing
                  </button>
                  <button
                    onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)}
                    className="btn-outline flex items-center gap-2 justify-center px-10 py-4"
                  >
                    Try law firm example →
                  </button>
                </div>
                <p className="text-sm text-text-muted">No credit card required · Free to use with your API key</p>
              </div>

              {/* Right: Product preview mockup */}
              <div className={`hero-reveal ${heroVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
                <div className={`glass-card rounded-2xl overflow-hidden border ${isLight ? 'border-zinc-200/80' : 'border-white/[0.08]'}`}>
                  <div className={`px-5 py-4 flex items-center gap-2 border-b ${isLight ? 'border-zinc-200/60 bg-zinc-50/80' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-zinc-400/60" />
                      <div className="w-3 h-3 rounded-full bg-zinc-400/40" />
                      <div className="w-3 h-3 rounded-full bg-zinc-400/40" />
                    </div>
                    <span className="text-xs font-medium text-text-muted ml-2">Jasmine — Generation</span>
                  </div>
                  <div className={`p-5 ${isLight ? 'bg-zinc-100/50' : 'bg-white/[0.02]'}`}>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">What will you design today?</p>
                    <div className={`rounded-xl p-4 h-24 mb-4 ${isLight ? 'bg-white border border-zinc-200' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
                      <p className="text-sm text-text-secondary">A landing page for a law firm — trustworthy, professional, navy and gold...</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isLight ? 'bg-zinc-200 text-zinc-700' : 'bg-white/10 text-white/80'}`}>Kimi K2</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isLight ? 'bg-zinc-200/80 text-zinc-900' : 'bg-white/10 text-white'}`}>Gemini</span>
                      </div>
                      <button onClick={onStartDesigning} className="btn-premium text-sm px-6 py-2.5 flex items-center gap-1.5">
                        <i className="ph ph-magic-wand text-base"></i>
                        Generate
                      </button>
                    </div>
                  </div>
                  <div className={`px-5 py-3 flex items-center gap-2 ${isLight ? 'bg-zinc-50 border-t border-zinc-200' : 'bg-white/[0.02] border-t border-white/[0.06]'}`}>
                    <i className="ph ph-folder text-lg text-text-muted"></i>
                    <span className="text-sm text-text-muted">Files → Preview → Deploy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— STATS ——— */}
        <section ref={statsRef} className="py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 ${reveal(statsVisible)}`}>
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className={`text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-2 ${statsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 80}ms`, transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)' }}>
                    {s.value}
                  </div>
                  <p className="text-text-muted text-sm font-medium tracking-[-0.01em]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— FEATURES ——— */}
        <section ref={featuresRef} className="py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className={`text-center mb-20 ${reveal(featuresVisible)}`}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-6">
                Full frontends, not prototypes
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-[1.5]">
                Everything you need for a shippable product. No placeholders, no shortcuts.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-2xl p-10 transition-all duration-500 hover:scale-[1.02] ${
                    featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${(i + 1) * 100}ms`, transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)' }}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isLight ? 'bg-zinc-100' : 'bg-white/10'}`}>
                    <i className={`ph ${f.icon} text-3xl ${isLight ? 'text-zinc-700' : 'text-white/90'}`}></i>
                  </div>
                  <h3 className="text-xl font-bold tracking-[-0.02em] text-text-primary mb-4 leading-[1.2]">{f.title}</h3>
                  <p className="text-text-secondary leading-[1.6] text-[15px]">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— HOW IT WORKS ——— */}
        <section ref={howRef} className={`py-32 ${isLight ? 'bg-zinc-50/50' : 'bg-white/[0.02]'}`}>
          <div className="max-w-5xl mx-auto px-6">
            <div className={`text-center mb-24 ${reveal(howVisible)}`}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-6">
                How it works
              </h2>
              <p className="text-text-secondary text-lg">Three steps from idea to deployed site.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 md:gap-16">
              {HOW_IT_WORKS.map((h, i) => (
                <div
                  key={i}
                  className={`text-center ${howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`}
                  style={{ transitionDelay: `${(i + 1) * 120}ms`, transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)' }}
                >
                  <div className={`w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center glass-card`}>
                    <i className={`ph ${h.icon} text-4xl ${isLight ? 'text-zinc-700' : 'text-white/90'}`}></i>
                  </div>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-text-muted">Step {h.step}</span>
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-text-primary mt-3 mb-4">{h.title}</h3>
                  <p className="text-text-secondary leading-[1.6]">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— QUICK PICKS ——— */}
        <section ref={cardsRef} className="py-32">
          <div className="max-w-6xl mx-auto px-6">
            <div className={`text-center mb-20 ${reveal(cardsVisible)}`}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-6">
                Try these prompts
              </h2>
              <p className="text-text-secondary text-lg max-w-xl mx-auto">
                One click to fill the prompt. Tweak and generate.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {EXAMPLE_CARDS.map((card, i) => (
                <button
                  key={i}
                  onClick={() => onSelectPrompt(card.prompt)}
                  className={`glass-card rounded-2xl p-8 text-left transition-all duration-500 hover:scale-[1.02] hover:border-white/20 ${
                    cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 70}ms`, transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)' }}
                >
                  <i className={`ph ${card.icon} text-3xl mb-5 block ${isLight ? 'text-zinc-600' : 'text-white/80'}`}></i>
                  <span className="text-lg font-bold tracking-[-0.02em] text-text-primary">{card.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ——— TESTIMONIAL ——— */}
        <section ref={testimonialRef} className={`py-32 ${isLight ? 'bg-zinc-50/50' : 'bg-white/[0.02]'}`}>
          <div className="max-w-4xl mx-auto px-6">
            <div className={`glass-card rounded-3xl p-16 md:p-24 text-center ${reveal(testimonialVisible)}`}>
              <i className={`ph ph-quotes text-5xl mb-8 block ${isLight ? 'text-zinc-300' : 'text-white/20'}`}></i>
              <blockquote className="text-2xl md:text-4xl font-bold tracking-[-0.02em] leading-[1.25] text-text-primary mb-10">
                "Jasmine feels like having a senior frontend engineer who actually ships."
              </blockquote>
              <p className="text-text-muted font-medium">Founder, YC-backed startup</p>
            </div>
          </div>
        </section>

        {/* ——— FAQ ——— */}
        <section ref={faqRef} className="py-32">
          <div className="max-w-2xl mx-auto px-6">
            <div className={`text-center mb-20 ${reveal(faqVisible)}`}>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary">
                Frequently asked
              </h2>
            </div>
            <div className="space-y-5">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-2xl p-8 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} transition-all duration-600`}
                  style={{ transitionDelay: `${(i + 1) * 100}ms`, transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)' }}
                >
                  <h4 className="font-bold text-lg text-text-primary mb-3">{item.q}</h4>
                  <p className="text-text-secondary leading-[1.6]">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ——— FINAL CTA ——— */}
        <section ref={ctaRef} className="py-40">
          <div className={`max-w-4xl mx-auto text-center px-6 ${reveal(ctaVisible)}`}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.03em] text-text-primary mb-8">
              Ready to design?
            </h2>
            <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
              Describe it. Jasmine crafts it. Edit in chat. Deploy when ready.
            </p>
            <button
              onClick={onStartDesigning}
              className="btn-premium inline-flex items-center gap-2 px-14 py-5 text-lg"
            >
              <i className="ph ph-rocket-launch text-xl"></i>
              Start designing
            </button>
            <p className="text-sm text-text-muted mt-8">No credit card required</p>
          </div>
        </section>

        {/* ——— PARTNER LOGOS ——— */}
        <section ref={logosRef} className={`py-20 ${isLight ? 'border-t border-zinc-200 bg-zinc-100/80' : 'border-t border-white/[0.06] bg-white/[0.02]'}`}>
          <div className={`max-w-4xl mx-auto px-6 text-center ${reveal(logosVisible)}`}>
            <p className="text-text-muted text-xs font-semibold tracking-[0.2em] uppercase mb-10">
              Powered by designers at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
              {PARTNER_LOGOS.map((p, i) => (
                <span key={i} className="text-text-muted text-sm font-medium opacity-70">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ——— FOOTER ——— */}
        <footer className={`py-12 ${isLight ? 'border-t border-zinc-200' : 'border-t border-white/[0.06]'}`}>
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-zinc-900' : 'bg-white'}`}>
                <i className={`ph-bold ph-sparkle text-sm ${isLight ? 'text-white' : 'text-zinc-900'}`}></i>
              </div>
              <span className="font-semibold text-text-primary">Jasmine</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-text-muted">
              <span>AI Website Designer</span>
              <a href="https://github.com/arjunkshah/jasmine" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
