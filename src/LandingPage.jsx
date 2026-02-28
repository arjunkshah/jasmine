import { useEffect, useRef, useState } from 'react';

const BENTO_ITEMS = [
  { span: 'md:col-span-2 md:row-span-2', icon: 'ph-magic-wand', title: 'Describe anything', desc: 'Law firms, restaurants, SaaS, portfolios. One prompt. Full Next.js project.', gradient: 'from-jasmine-500/20 to-transparent' },
  { span: '', icon: 'ph-lightning', title: 'Kimi K2', desc: 'Blazing fast via Groq', gradient: 'from-violet-500/15 to-transparent' },
  { span: '', icon: 'ph-palette', title: 'Gemini', desc: 'Creative depth', gradient: 'from-emerald-500/15 to-transparent' },
  { span: 'md:col-span-2', icon: 'ph-sparkle', title: 'Anti-AI-slop craft', desc: 'Premium typography, Phosphor icons, blur-reveal, inner shadows.', gradient: 'from-amber-500/10 to-transparent' },
  { span: '', icon: 'ph-stack', title: 'Full project', desc: 'src/, TypeScript, Tailwind. Deploy.', gradient: 'from-cyan-500/15 to-transparent' },
];

const TESTIMONIALS = [
  { quote: "Generated a law firm site in 20 seconds. Looked like we paid a design agency.", author: "Founder", role: "Legal startup" },
  { quote: "The typography and spacing are insane. No way this is AI.", author: "Designer", role: "YC-backed" },
  { quote: "Finally, an AI that doesn't output slop. Jasmine gets it.", author: "Engineer", role: "Indie hacker" },
];

const MARQUEE_ITEMS = [
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg', label: 'Next.js' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', label: 'React' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', label: 'TypeScript' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', label: 'Tailwind' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg', label: 'Figma' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg', label: 'Vercel' },
];

const STEPS = [
  { num: '01', label: 'Describe', desc: 'Tell Jasmine what you want — law firm, restaurant, SaaS, portfolio. One sentence.', icon: 'ph-chat-circle-dots' },
  { num: '02', label: 'Generate', desc: 'AI crafts the full project: every page, every section, every animation. No slop.', icon: 'ph-wand' },
  { num: '03', label: 'Refine', desc: 'Edit in real time. Copy, download, or deploy to E2B.', icon: 'ph-pencil-simple' },
];

const HORIZONTAL_FEATURES = [
  { icon: 'ph-typography', title: 'Premium typography', desc: 'Lora, DM Sans, Space Grotesk — curated pairings' },
  { icon: 'ph-palette', title: 'Cohesive palettes', desc: 'Navy & gold, warm earth, dark mode — no clash' },
  { icon: 'ph-layout', title: 'Smart layouts', desc: 'Grids, cards, sections — production-ready structure' },
  { icon: 'ph-image', title: 'Placeholder art', desc: 'Unsplash integration, no broken images' },
  { icon: 'ph-file-code', title: 'Clean code', desc: 'TypeScript, src/, proper structure' },
  { icon: 'ph-download-simple', title: 'One-click export', desc: 'Copy or download. Deploy to E2B.' },
  { icon: 'ph-squares-four', title: 'Depth & shadows', desc: 'Inner shadows, blur-reveal, tactile 3D feel' },
  { icon: 'ph-text-t', title: 'Tight tracking', desc: 'Letter-spacing and leading tuned for premium look' },
  { icon: 'ph-device-responsive', title: 'Responsive', desc: 'Mobile-first, breakpoints, viewport-aware' },
  { icon: 'ph-paint-brush', title: 'Anti-slop craft', desc: 'No generic fonts or Lucide. Phosphor icons only.' },
];

const FAQ_ITEMS = [
  { q: 'What can I build?', a: 'Full Next.js sites for law firms, restaurants, SaaS, portfolios, agencies, gaming studios — anything you can describe. Jasmine crafts production-ready projects with src/, TypeScript, Tailwind.' },
  { q: 'How does it work?', a: 'Describe your site in one prompt. Jasmine uses Kimi K2 or Gemini to generate a complete Next.js project. Edit in real time, then copy, download, or deploy to E2B sandbox.' },
  { q: 'Is it really free?', a: 'Yes. Generate and export as many projects as you want. No signup, no credit card required.' },
  { q: 'Can I use the output commercially?', a: 'Absolutely. The code you generate is yours. Use it for your business, client work, or portfolio.' },
];

const EXAMPLE_CARDS = [
  { label: 'Law firm', desc: 'Professional landing for attorneys — practice areas, team bios, contact CTA. Trustworthy Lora serif, navy & gold accents.', prompt: 'Complete law firm website — home, about, practice areas grid, team bios, contact page. Trustworthy, Lora serif, navy and gold. Every page, every section, every animation.' },
  { label: 'SaaS', desc: 'Developer tool landing — dark mode, code block hero, feature grid, pricing. Vercel-inspired, Space Grotesk.', prompt: 'Complete SaaS site for a dev tool — landing, features, pricing, docs, dashboard. Dark mode, Vercel-inspired, Space Grotesk. Every page, every section, every animation.' },
  { label: 'Restaurant', desc: 'Restaurant or cafe site — menu section, reservation CTA, food imagery. Warm, appetizing, DM Sans.', prompt: 'Complete restaurant website — home, full menu, reservations, about, contact. Warm, appetizing, DM Sans. Every page, every section, every animation.' },
  { label: 'Gaming studio', desc: 'Gaming studio portfolio — bold gradients, game showcase grid, Overused Grotesk. High-energy, immersive.', prompt: 'Complete gaming studio site — home, games showcase, team, careers, contact. Bold gradients, Overused Grotesk. Every page, every section, every animation.' },
  { label: 'Meditation app', desc: 'Wellness or meditation app — soft, calming, Lora serif. Testimonial carousel, pill CTAs.', prompt: 'Complete meditation app site — landing, features, testimonial carousel, pricing, download CTA. Soft, calming, Lora serif. Every page, every section, every animation.' },
  { label: 'Creative agency', desc: 'Portfolio for design studios — dark editorial, asymmetric grid, case studies. Bold typography.', prompt: 'Complete creative agency portfolio — home, case studies, about, services, contact. Dark editorial, asymmetric grid. Every page, every section, every animation.' },
];

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const [heroRef, heroVisible] = useScrollReveal(0.2);
  const [marqueeRef, marqueeVisible] = useScrollReveal(0.1);
  const [bentoRef, bentoVisible] = useScrollReveal(0.05);
  const [stepsRef, stepsVisible] = useScrollReveal(0.1);
  const [carouselRef, carouselVisible] = useScrollReveal(0.2);
  const [horizontalRef, horizontalVisible] = useScrollReveal(0.1);
  const [cardsRef, cardsVisible] = useScrollReveal(0.1);
  const [faqRef, faqVisible] = useScrollReveal(0.1);
  const [ctaRef, ctaVisible] = useScrollReveal(0.2);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCarouselIndex(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white/90 backdrop-blur-xl border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]' : 'bg-white/[0.03] backdrop-blur-xl border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero — two-column, trust line, premium typography */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-jasmine-400/15 blur-[140px] transition-opacity duration-1000 ${heroVisible ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-violet-500/12 blur-[120px] transition-opacity duration-1000 delay-200 ${heroVisible ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[180px] transition-opacity duration-1000 delay-300 ${heroVisible ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className={`relative max-w-6xl mx-auto w-full transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <p className="text-jasmine-400 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Trusted by designers at YC, Figma, Linear</p>
              <h1 className="text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] font-extrabold tracking-[-0.04em] leading-[0.92] text-text-primary mb-6" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                Design anything.
              </h1>
              <p className="text-lg md:text-xl text-text-secondary leading-[1.5] max-w-xl mb-10 tracking-[-0.01em]">
                Describe the website you want. Jasmine crafts a full Next.js project — every page, every section, every animation. Pixel-perfect. Production-ready.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onStartDesigning}
                  className="btn-premium flex items-center gap-3 text-[#0a0a0b] text-base px-8 py-4"
                >
                  <i className="ph ph-magic-wand text-xl"></i>
                  <span>Start designing</span>
                  <i className="ph ph-arrow-right text-lg"></i>
                </button>
                <button
                  onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)}
                  className="flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-sm border-2 border-white/20 hover:border-jasmine-400/40 text-text-primary transition-all"
                >
                  <i className="ph ph-lightning text-lg text-jasmine-400"></i>
                  Try law firm
                </button>
              </div>
            </div>
            <div className={`relative hidden lg:block ${heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} transition-all duration-700 delay-200`}>
              <div className={`${cardCl} border rounded-3xl p-8 overflow-hidden`}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                </div>
                <pre className="text-[11px] font-mono text-text-secondary leading-relaxed overflow-x-auto">
{`src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/page.tsx
│   └── contact/page.tsx
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
└── ...
`}
                </pre>
                <p className="text-xs text-text-muted mt-4">Full Next.js project • TypeScript • Tailwind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section ref={marqueeRef} className={`py-16 border-t ${borderCl} overflow-hidden`}>
        <div className={`transition-all duration-700 ${marqueeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase text-center mb-10">Tech you get</p>
          <div className="relative">
            <div className="marquee-track">
              {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                <div key={i} className="flex items-center gap-4 mx-10 shrink-0">
                  <div className={`w-16 h-16 rounded-2xl ${cardCl} border flex items-center justify-center p-2.5 transition-transform hover:scale-105`}>
                    <img src={item.logo} alt={item.label} className="w-9 h-9 object-contain" />
                  </div>
                  <span className="text-text-secondary font-medium text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <section ref={bentoRef} className={`px-6 md:px-12 lg:px-24 py-32 border-t ${borderCl}`}>
        <div className={`max-w-6xl mx-auto transition-all duration-700 delay-150 ${bentoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">How it works</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-text-primary mb-20 leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            One prompt. Full project.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 [grid-auto-rows:minmax(160px,auto)]">
            {BENTO_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`relative ${item.span} ${cardCl} border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 hover:scale-[1.02] hover:border-jasmine-400/20 ${bentoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} pointer-events-none`} />
                <div className="relative">
                  <i className={`ph ${item.icon} text-2xl text-jasmine-400 mb-3 block`}></i>
                  <h3 className="text-lg font-bold text-text-primary mb-1 tracking-[-0.02em]">{item.title}</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed relative">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section ref={stepsRef} className={`px-6 md:px-12 lg:px-24 py-32 border-t ${borderCl}`}>
        <div className={`max-w-6xl mx-auto transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Process</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-text-primary mb-20 leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            Three steps. Zero friction.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`relative ${cardCl} border rounded-2xl p-8 transition-all duration-500 hover:border-jasmine-400/20 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <span className="text-5xl font-extrabold text-jasmine-400/25 tracking-[-0.04em]">{step.num}</span>
                <div className="mt-4 flex items-center gap-3">
                  <i className={`ph ${step.icon} text-2xl text-jasmine-400`}></i>
                  <h3 className="text-xl font-bold text-text-primary tracking-[-0.02em]">{step.label}</h3>
                </div>
                <p className="text-text-secondary mt-3 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial carousel */}
      <section ref={carouselRef} className={`px-6 md:px-12 lg:px-24 py-32 border-t ${borderCl}`}>
        <div className={`max-w-4xl mx-auto transition-all duration-700 ${carouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">What people say</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-text-primary mb-20 leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            Built for designers who care.
          </h2>
          <div className="relative min-h-[300px]">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`transition-all duration-700 ease-out ${i === carouselIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute inset-x-0 top-0 pointer-events-none'}`}
              >
                <blockquote className={`${cardCl} border rounded-2xl p-12 md:p-16`}>
                  <p className="text-2xl md:text-3xl font-medium text-text-primary leading-[1.3] tracking-[-0.02em] mb-8" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="font-semibold text-text-primary">{t.author}</p>
                    <p className="text-sm text-text-muted">{t.role}</p>
                  </div>
                </blockquote>
              </div>
            ))}
            <div className="flex gap-2 mt-8 justify-center">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === carouselIndex ? 'bg-jasmine-400 w-8' : 'bg-white/20 w-2 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal scroll features */}
      <section ref={horizontalRef} className={`py-32 border-t ${borderCl}`}>
        <div className={`transition-all duration-700 ${horizontalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="px-6 md:px-12 lg:px-24 mb-16">
            <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Built-in craft</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-text-primary leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
              Every detail, handled.
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />
            <div className="overflow-x-auto overflow-y-hidden pb-4 -mx-6 md:-mx-12 px-6 md:px-12 scrollbar-hide snap-x snap-mandatory">
              <div className="flex gap-5 w-max pl-4 md:pl-24 pr-4 md:pr-24">
                {HORIZONTAL_FEATURES.map((f, i) => (
                  <div
                    key={i}
                    className={`shrink-0 w-[300px] snap-start ${cardCl} border rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02] hover:border-jasmine-400/20 ${horizontalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    <i className={`ph ${f.icon} text-2xl text-jasmine-400 mb-3 block`}></i>
                    <h3 className="text-lg font-bold text-text-primary mb-1 tracking-[-0.02em]">{f.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example prompts cards */}
      <section ref={cardsRef} className={`px-6 md:px-12 lg:px-24 py-32 border-t ${borderCl}`}>
        <div className={`max-w-6xl mx-auto transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Try these</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-text-primary mb-20 leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            One click to start.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {EXAMPLE_CARDS.map((card, i) => (
              <div
                key={i}
                className={`${cardCl} border rounded-2xl p-6 text-left transition-all duration-300 hover:border-jasmine-400/30 hover:shadow-lg hover:shadow-jasmine-400/5 flex flex-col ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="text-jasmine-400 font-semibold text-sm uppercase tracking-wider">{card.label}</span>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed flex-1">{card.desc}</p>
                <button
                  onClick={() => onSelectPrompt(card.prompt)}
                  className="btn-premium mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[#0a0a0b] text-sm font-semibold"
                >
                  <i className="ph ph-magic-wand text-base"></i>
                  Try it
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className={`px-6 md:px-12 lg:px-24 py-32 border-t ${borderCl}`}>
        <div className={`max-w-2xl mx-auto transition-all duration-700 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-text-muted text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-text-primary mb-16 leading-[1.1]" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            Questions? Answers.
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`${cardCl} border rounded-xl overflow-hidden transition-all duration-300 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-semibold text-text-primary">{item.q}</span>
                  <i className={`ph ph-caret-down text-text-muted transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faqOpen === i ? 'max-h-48' : 'max-h-0'}`}>
                  <p className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className={`px-6 md:px-12 lg:px-24 py-20 border-t ${borderCl}`}>
        <div className="max-w-4xl mx-auto flex flex-wrap gap-16 md:gap-24 justify-center">
          {[
            { value: 'Kimi K2', label: 'Blazing fast' },
            { value: 'Gemini', label: 'Creative depth' },
            { value: 'Full project', label: 'src/, TypeScript' },
            { value: 'Anti-slop', label: 'Premium craft' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-text-primary tracking-[-0.02em]">{stat.value}</p>
              <p className="text-sm text-text-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className={`px-6 md:px-12 lg:px-24 py-40 border-t ${borderCl}`}>
        <div className={`max-w-2xl mx-auto text-center transition-all duration-700 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] leading-[1.05] text-text-primary mb-6" style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}>
            Ready to design?
          </h2>
          <p className="text-xl text-text-secondary mb-12 tracking-[-0.01em]">
            Describe it. Jasmine crafts it.
          </p>
          <button
            onClick={onStartDesigning}
            className="btn-premium inline-flex items-center gap-3 text-[#0a0a0b] text-base px-10 py-4"
          >
            <i className="ph ph-rocket-launch text-xl"></i>
            <span>Start designing</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
