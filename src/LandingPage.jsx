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
  {
    title: 'Full Next.js Projects',
    description: 'Not snippets. Complete apps with src/, TypeScript, Tailwind. Every page, every section, every animation.',
    icon: 'ph-stack',
  },
  {
    title: 'Edit in Natural Language',
    description: 'Generated something close? Chat to refine. "Make the header darker" or "Add a pricing section" — targeted edits, not full regens.',
    icon: 'ph-chat-circle-dots',
  },
  {
    title: 'Production-Ready Output',
    description: 'Phosphor icons, Figtree typography, blur-reveal animations. Anti-AI-slop design system built in.',
    icon: 'ph-sparkle',
  },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Describe it', desc: 'One prompt. What you want, the vibe, the pages.', icon: 'ph-pencil-simple' },
  { step: 2, title: 'Generate', desc: 'Jasmine crafts a full Next.js project. Streams code in real time.', icon: 'ph-magic-wand' },
  { step: 3, title: 'Edit & deploy', desc: 'Chat to tweak. Deploy to E2B. Download the code.', icon: 'ph-rocket-launch' },
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
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold, rootMargin: '0px 0px -80px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const [heroRef, heroVisible] = useScrollReveal(0.05);
  const [featuresRef, featuresVisible] = useScrollReveal(0.1);
  const [howRef, howVisible] = useScrollReveal(0.1);
  const [cardsRef, cardsVisible] = useScrollReveal(0.05);
  const [testimonialRef, testimonialVisible] = useScrollReveal(0.1);
  const [faqRef, faqVisible] = useScrollReveal(0.1);
  const [ctaRef, ctaVisible] = useScrollReveal(0.1);
  const [logosRef, logosVisible] = useScrollReveal(0.1);

  const isLight = theme === 'light';

  const glassCard = isLight
    ? 'bg-white/80 backdrop-blur-xl border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]'
    : 'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]';

  const transition = (visible, delay = 0) =>
    `transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ——— HERO ——— */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col justify-center items-center px-6 md:px-12 pt-16 pb-24">
        <div className={`max-w-4xl mx-auto text-center hero-reveal ${heroVisible ? 'visible' : ''}`}>
          <p className={`text-xs font-semibold tracking-[0.2em] uppercase mb-8 ${isLight ? 'text-zinc-500' : 'text-white/60'}`}>
            Trusted by 10,000+ designers building better products
          </p>
          <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[6rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-text-primary mb-8">
            Your Ideas Deserve Better Frontends.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary leading-[1.5] max-w-2xl mx-auto mb-12 tracking-[-0.01em]">
            Describe the website you want. Jasmine crafts a full Next.js project — every page, every section, every animation. Pixel-perfect. Production-ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onStartDesigning}
              className="btn-premium flex items-center gap-2 w-full sm:w-auto justify-center px-10 py-4"
            >
              <i className="ph ph-magic-wand text-xl"></i>
              Start designing
            </button>
            <button
              onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)}
              className="btn-outline flex items-center gap-2 w-full sm:w-auto justify-center px-10 py-4"
            >
              Try law firm example →
            </button>
          </div>
          <p className="text-sm text-text-muted">No credit card required · Free to use with your API key</p>
        </div>
      </section>

      {/* ——— FEATURES ——— */}
      <section ref={featuresRef} className={`py-28 ${isLight ? 'bg-zinc-50' : 'bg-white/[0.02]'}`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-16 ${transition(featuresVisible)}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary mb-4">
              Full frontends, not prototypes
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Everything you need for a shippable product. No placeholders, no shortcuts.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 ${glassCard} transition-all duration-500 hover:scale-[1.02] ${
                  featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${(i + 1) * 80}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${isLight ? 'bg-zinc-100' : 'bg-white/10'}`}>
                  <i className={`ph ${f.icon} text-2xl ${isLight ? 'text-zinc-700' : 'text-white/90'}`}></i>
                </div>
                <h3 className="text-xl font-bold tracking-[-0.02em] text-text-primary mb-3">{f.title}</h3>
                <p className="text-text-secondary leading-[1.5] text-[15px]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— HOW IT WORKS ——— */}
      <section ref={howRef} className="py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`text-center mb-20 ${transition(howVisible)}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary mb-4">
              How it works
            </h2>
            <p className="text-text-secondary">Three steps from idea to deployed site.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {HOW_IT_WORKS.map((h, i) => (
              <div
                key={i}
                className={`text-center ${howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-700`}
                style={{ transitionDelay: `${(i + 1) * 100}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${glassCard}`}>
                  <i className={`ph ${h.icon} text-3xl ${isLight ? 'text-zinc-700' : 'text-white/90'}`}></i>
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-text-muted">Step {h.step}</span>
                <h3 className="text-xl font-bold tracking-[-0.02em] text-text-primary mt-2 mb-3">{h.title}</h3>
                <p className="text-text-secondary text-sm leading-[1.5]">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— QUICK PICKS ——— */}
      <section ref={cardsRef} className={`py-28 ${isLight ? 'bg-zinc-50' : 'bg-white/[0.02]'}`}>
        <div className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-16 ${transition(cardsVisible)}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary mb-4">
              Try these prompts
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              One click to fill the prompt. Tweak and generate.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {EXAMPLE_CARDS.map((card, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(card.prompt)}
                className={`text-left p-6 rounded-2xl ${glassCard} transition-all duration-300 hover:scale-[1.02] hover:border-white/20 ${
                  cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <i className={`ph ${card.icon} text-2xl mb-3 block ${isLight ? 'text-zinc-600' : 'text-white/80'}`}></i>
                <span className="text-base font-bold tracking-[-0.02em] text-text-primary">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ——— TESTIMONIAL ——— */}
      <section ref={testimonialRef} className="py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className={`${glassCard} rounded-3xl p-12 md:p-16 ${transition(testimonialVisible)}`}>
            <i className={`ph ph-quotes text-4xl mb-6 block ${isLight ? 'text-zinc-300' : 'text-white/20'}`}></i>
            <blockquote className="text-2xl md:text-3xl font-bold tracking-[-0.02em] leading-[1.3] text-text-primary mb-8">
              "Jasmine feels like having a senior frontend engineer who actually ships."
            </blockquote>
            <p className="text-text-muted text-sm font-medium">Founder, YC-backed startup</p>
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section ref={faqRef} className={`py-28 ${isLight ? 'bg-zinc-50' : 'bg-white/[0.02]'}`}>
        <div className="max-w-2xl mx-auto px-6">
          <div className={`text-center mb-16 ${transition(faqVisible)}`} style={{ transitionDelay: '0ms' }}>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary mb-4">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className={`${glassCard} rounded-xl p-6 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} transition-all duration-600`}
                style={{ transitionDelay: `${(i + 1) * 80}ms` }}
              >
                <h4 className="font-bold text-text-primary mb-2">{item.q}</h4>
                <p className="text-text-secondary text-sm leading-[1.5]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FINAL CTA ——— */}
      <section ref={ctaRef} className="py-32">
        <div className={`max-w-3xl mx-auto text-center px-6 ${transition(ctaVisible)}`}>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-text-primary mb-6">
            Ready to design?
          </h2>
          <p className="text-lg text-text-secondary mb-10">
            Describe it. Jasmine crafts it. Edit in chat. Deploy when ready.
          </p>
          <button
            onClick={onStartDesigning}
            className="btn-premium inline-flex items-center gap-2 px-12 py-4 text-lg"
          >
            <i className="ph ph-rocket-launch text-xl"></i>
            Start designing
          </button>
          <p className="text-sm text-text-muted mt-6">No credit card required</p>
        </div>
      </section>

      {/* ——— PARTNER LOGOS ——— */}
      <section ref={logosRef} className={`py-16 ${isLight ? 'border-t border-zinc-200 bg-zinc-100' : 'border-t border-white/[0.06] bg-white/[0.02]'}`}>
        <div className={`max-w-4xl mx-auto px-6 text-center ${transition(logosVisible)}`}>
          <p className="text-text-muted text-xs font-semibold tracking-[0.2em] uppercase mb-8">
            Powered by designers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
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
  );
}

export default LandingPage;
