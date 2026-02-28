import { useEffect, useRef, useState } from 'react';

const PARTNER_LOGOS = [
  { name: 'Voxel Labs' },
  { name: 'Warpspeed' },
  { name: 'Mastermail' },
  { name: 'Leapyear' },
  { name: 'Lightspeed' },
];

const EXAMPLE_CARDS = [
  { label: 'Law firm', prompt: 'Complete law firm website — home, about, practice areas grid, team bios, contact page. Trustworthy, Lora serif, navy and gold. Every page, every section, every animation.' },
  { label: 'SaaS', prompt: 'Complete SaaS site for a dev tool — landing, features, pricing, docs, dashboard. Dark mode, Vercel-inspired, Space Grotesk. Every page, every section, every animation.' },
  { label: 'Restaurant', prompt: 'Complete restaurant website — home, full menu, reservations, about, contact. Warm, appetizing, DM Sans. Every page, every section, every animation.' },
  { label: 'Gaming studio', prompt: 'Complete gaming studio site — home, games showcase, team, careers, contact. Bold gradients, Overused Grotesk. Every page, every section, every animation.' },
  { label: 'Meditation app', prompt: 'Complete meditation app site — landing, features, testimonial carousel, pricing, download CTA. Soft, calming, Lora serif. Every page, every section, every animation.' },
  { label: 'Creative agency', prompt: 'Complete creative agency portfolio — home, case studies, about, services, contact. Dark editorial, asymmetric grid. Every page, every section, every animation.' },
];

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold, rootMargin: '0px 0px -50px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const [heroRef, heroVisible] = useScrollReveal(0.15);
  const [cardsRef, cardsVisible] = useScrollReveal(0.05);
  const [ctaRef, ctaVisible] = useScrollReveal(0.1);

  const isLight = theme === 'light';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Centralized hero — monochrome, Finora/Velar/Lendro style */}
      <section ref={heroRef} className="relative min-h-[85vh] flex flex-col justify-center items-center px-6 md:px-12 text-center">
        <div className={`max-w-3xl mx-auto transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-text-muted text-sm font-medium tracking-[0.08em] uppercase mb-6">
            Trusted by 10,000+ designers building better products
          </p>
          <h1 className="text-[3rem] md:text-[4rem] lg:text-[5rem] font-extrabold tracking-[-0.04em] leading-[1.05] text-text-primary mb-6">
            Your Ideas Deserve Better Frontends.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary leading-[1.6] max-w-2xl mx-auto mb-12 tracking-[-0.01em]">
            Describe the website you want. Jasmine crafts a full Next.js project — every page, every section, every animation. Pixel-perfect. Production-ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartDesigning}
              className="btn-premium flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <i className="ph ph-magic-wand text-lg"></i>
              Start designing
            </button>
            <button
              onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)}
              className="btn-outline flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Try law firm →
            </button>
          </div>
        </div>
      </section>

      {/* Example prompts — minimal cards */}
      <section ref={cardsRef} className={`py-24 border-t ${isLight ? 'border-zinc-200' : 'border-white/[0.06]'}`}>
        <div className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-text-muted text-xs font-semibold tracking-[0.2em] uppercase text-center mb-8">Try these</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXAMPLE_CARDS.map((card, i) => (
              <button
                key={i}
                onClick={() => onSelectPrompt(card.prompt)}
                className={`text-left px-4 py-3 rounded-lg border transition-all hover:border-white/20 ${
                  isLight ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300' : 'bg-white/[0.02] border-white/[0.06]'
                } ${cardsVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <span className="text-sm font-medium text-text-primary">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Partner logos — monochrome strip */}
      <section ref={ctaRef} className={`py-16 ${isLight ? 'bg-zinc-100' : 'bg-white/[0.02]'}`}>
        <div className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${ctaVisible ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-text-muted text-xs font-medium tracking-[0.15em] uppercase text-center mb-8">
            Powered by designers at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {PARTNER_LOGOS.map((p, i) => (
              <span key={i} className="text-text-muted text-sm font-medium tracking-wide opacity-70">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-32 ${isLight ? 'border-t border-zinc-200' : 'border-t border-white/[0.06]'}`}>
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-[-0.03em] text-text-primary mb-4">
            Ready to design?
          </h2>
          <p className="text-text-secondary mb-8">
            Describe it. Jasmine crafts it.
          </p>
          <button onClick={onStartDesigning} className="btn-premium inline-flex items-center gap-2">
            <i className="ph ph-rocket-launch text-lg"></i>
            Start designing
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
