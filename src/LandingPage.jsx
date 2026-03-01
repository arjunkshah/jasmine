import { useEffect, useRef, useState } from 'react';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import BlurPopUp from './components/BlurPopUp';

const BENTO_ITEMS = [
  { span: 'md:col-span-2 md:row-span-2', icon: 'ph-magic-wand', title: 'world\'s best designer', desc: 'law firms, restaurants, saas, portfolios. one prompt. jasmine crafts it.' },
  { span: '', icon: 'ph-lightning', title: 'kimi k2', desc: 'blazing fast via groq' },
  { span: '', icon: 'ph-palette', title: 'gemini', desc: 'creative depth' },
  { span: 'md:col-span-2', icon: 'ph-sparkle', title: 'anti-ai-slop craft', desc: 'premium typography, phosphor icons, blur-reveal.' },
  { span: '', icon: 'ph-stack', title: 'full project', desc: 'src/, typescript, tailwind. deploy.' },
];

const BENTO_OUTPUT = [
  { span: 'md:col-span-2', icon: 'ph-file-tsx', title: 'typescript', desc: 'strict types, clean interfaces.' },
  { span: '', icon: 'ph-paint-bucket', title: 'tailwind', desc: 'utility-first. consistent spacing.' },
  { span: '', icon: 'ph-rocket-launch', title: 'deploy-ready', desc: 'Netlify. one click.' },
  { span: 'md:col-span-2 md:row-span-2', icon: 'ph-code', title: 'world-class code', desc: 'proper structure, components, layouts. the best designer delivers.' },
  { span: '', icon: 'ph-download-simple', title: 'one-click zip', desc: 'download full project.' },
];

const TESTIMONIALS = [
  { quote: "generated a law firm site in 20 seconds. looked like we paid a design agency.", author: "founder", role: "legal startup" },
  { quote: "the typography and spacing are insane. no way this is ai.", author: "designer", role: "yc-backed" },
  { quote: "finally, an ai that doesn't output slop. jasmine gets it.", author: "engineer", role: "indie hacker" },
];

const MARQUEE_ITEMS = [
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vitejs/vitejs-original.svg', label: 'vite' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', label: 'react' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', label: 'typescript' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg', label: 'tailwind' },
  { logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg', label: 'vercel' },
];

const STEPS = [
  { num: '01', label: 'describe', desc: 'tell jasmine what you want — law firm, restaurant, saas, portfolio. one sentence.', icon: 'ph-chat-circle-dots' },
  { num: '02', label: 'generate', desc: 'ai crafts the full project: every page, every section. no slop.', icon: 'ph-wand' },
  { num: '03', label: 'refine', desc: 'edit in real time. download or deploy to Netlify.', icon: 'ph-pencil-simple' },
];

const HORIZONTAL_FEATURES = [
  { icon: 'ph-typography', title: 'premium typography', desc: 'curated pairings' },
  { icon: 'ph-palette', title: 'cohesive palettes', desc: 'no clash' },
  { icon: 'ph-layout', title: 'smart layouts', desc: 'world-class structure' },
  { icon: 'ph-file-code', title: 'clean code', desc: 'typescript, src/' },
  { icon: 'ph-download-simple', title: 'one-click export', desc: 'download or deploy to Netlify' },
  { icon: 'ph-device-responsive', title: 'responsive', desc: 'mobile-first' },
];

const FAQ_ITEMS = [
  { q: 'what can i build?', a: 'full sites for law firms, restaurants, saas, portfolios, agencies — anything you can describe. jasmine is the world\'s best designer. vite, react, tailwind.' },
  { q: 'how does it work?', a: 'describe what you want in one prompt. jasmine — the world\'s best designer — uses kimi k2 or gemini to craft it. edit in real time, download or deploy to Netlify.' },
  { q: 'is it really free?', a: 'yes. generate and export as many projects as you want. no signup, no credit card required.' },
  { q: 'can i use the output commercially?', a: 'absolutely. the code you generate is yours.' },
];

const EXAMPLE_CARDS = [
  { label: 'law firm', desc: 'professional landing — practice areas, team bios. trustworthy, navy & gold.', prompt: 'Complete law firm website — home, about, practice areas grid, team bios, contact page. Trustworthy, Lora serif, navy and gold. Every page, every section, every animation.' },
  { label: 'saas', desc: 'developer tool landing — dark mode, feature grid, pricing. vercel-inspired.', prompt: 'Complete SaaS site for a dev tool — landing, features, pricing, docs, dashboard. Dark mode, Vercel-inspired, Space Grotesk. Every page, every section, every animation.' },
  { label: 'restaurant', desc: 'menu section, reservation cta. warm, appetizing.', prompt: 'Complete restaurant website — home, full menu, reservations, about, contact. Warm, appetizing, DM Sans. Every page, every section, every animation.' },
  { label: 'gaming studio', desc: 'bold gradients, game showcase. high-energy.', prompt: 'Complete gaming studio site — home, games showcase, team, careers, contact. Bold gradients, Overused Grotesk. Every page, every section, every animation.' },
  { label: 'meditation app', desc: 'soft, calming. testimonial carousel.', prompt: 'Complete meditation app site — landing, features, testimonial carousel, pricing, download CTA. Soft, calming, Lora serif. Every page, every section, every animation.' },
  { label: 'creative agency', desc: 'dark editorial, case studies.', prompt: 'Complete creative agency portfolio — home, case studies, about, services, contact. Dark editorial, asymmetric grid. Every page, every section, every animation.' },
];

const STATS = [
  { value: '20s', label: 'average generation time' },
  { value: '100%', label: 'world-class' },
  { value: '0', label: 'setup required' },
  { value: '∞', label: 'projects free' },
];

const USE_CASES = [
  { icon: 'ph-buildings', label: 'law & finance', desc: 'trustworthy, professional' },
  { icon: 'ph-fork-knife', label: 'restaurants', desc: 'warm, appetizing' },
  { icon: 'ph-rocket-launch', label: 'saas', desc: 'dark mode, feature grids' },
  { icon: 'ph-game-controller', label: 'gaming', desc: 'bold, immersive' },
  { icon: 'ph-heart', label: 'wellness', desc: 'soft, calming' },
  { icon: 'ph-palette', label: 'agencies', desc: 'dark editorial' },
];

const COMPARISON = [
  { traditional: 'weeks of design', jasmine: '20 seconds' },
  { traditional: '$10k+ agency', jasmine: 'free' },
  { traditional: 'back-and-forth', jasmine: 'instant edits' },
  { traditional: 'generic templates', jasmine: 'custom craft' },
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

const sectionCl = 'px-6 md:px-12 lg:px-24';
const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
const maxW = 'max-w-4xl mx-auto';

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const [marqueeRef, marqueeVisible] = useScrollReveal(0.1);
  const [bentoRef, bentoVisible] = useScrollReveal(0.05);
  const [stepsRef, stepsVisible] = useScrollReveal(0.1);
  const [carouselRef, carouselVisible] = useScrollReveal(0.2);
  const [horizontalRef, horizontalVisible] = useScrollReveal(0.1);
  const [cardsRef, cardsVisible] = useScrollReveal(0.1);
  const [faqRef, faqVisible] = useScrollReveal(0.1);
  const [ctaRef, ctaVisible] = useScrollReveal(0.2);
  const [statsRef, statsVisible] = useScrollReveal(0.1);
  const [bento2Ref, bento2Visible] = useScrollReveal(0.05);
  const [comparisonRef, comparisonVisible] = useScrollReveal(0.1);
  const [useCasesRef, useCasesVisible] = useScrollReveal(0.1);
  const [valueRef, valueVisible] = useScrollReveal(0.2);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCarouselIndex(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white border border-zinc-200/60 card-3d' : 'bg-white/[0.02] border border-white/[0.06] card-3d';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* hero */}
      <section className={`relative min-h-[90vh] flex flex-col justify-center ${sectionCl} overflow-hidden`}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/hero-bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/60 to-surface" />
        <div className={`relative ${maxW} w-full`}>
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
            <div>
              <BlurPopUp delay={0}>
                <p className={`${labelCl} font-display text-3d`}>the world's best designer</p>
              </BlurPopUp>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.1] text-text-primary mb-6 font-display text-3d">
                <BlurPopUpByWord text="design anything." wordDelay={0.05} />
              </h1>
              <BlurPopUp delay={0.6}>
                <p className="text-base md:text-lg text-text-secondary leading-[1.6] max-w-lg mb-12">
                  describe what you want. jasmine crafts it — every page, every section. the best designer, one prompt.
                </p>
              </BlurPopUp>
              <div className="flex flex-wrap gap-3">
                <BlurPopUp delay={0.9}>
                  <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 text-sm px-8 py-3">
                    <i className="ph ph-magic-wand text-base"></i>
                    start designing
                  </button>
                </BlurPopUp>
                <BlurPopUp delay={1}>
                  <button
                    onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)}
                    className="btn-ghost flex items-center gap-2 px-8 py-3 text-sm font-medium text-text-primary"
                  >
                    try law firm
                  </button>
                </BlurPopUp>
              </div>
            </div>
            <BlurPopUp delay={1.1} className="relative hidden lg:block">
              <div className={`${cardCl} rounded-lg p-6 overflow-hidden`}>
                <pre className="text-[12px] font-mono text-text-secondary leading-relaxed overflow-x-auto">
{`src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── components/
└── ...
`}
                </pre>
                <p className="text-xs text-text-muted mt-4">vite · react · tailwind</p>
              </div>
            </BlurPopUp>
          </div>
        </div>
      </section>

      {/* stats */}
      <section ref={statsRef} className={`relative py-24 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: `url('/lander-stats-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/85 via-surface/95 to-surface" aria-hidden />
        <div className={`relative ${maxW} ${sectionCl} transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 md:gap-24">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl font-medium text-text-primary tracking-tight">{stat.value}</p>
                <p className="text-xs text-text-muted mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* marquee */}
      <section ref={marqueeRef} className={`py-24 border-t ${borderCl} overflow-hidden`}>
        <div className={`transition-all duration-700 ${marqueeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={`${labelCl} text-center mb-12`}>tech</p>
          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-3 mx-10 shrink-0">
                <div className={`w-12 h-12 rounded-lg ${cardCl} flex items-center justify-center p-2`}>
                  <img src={item.logo} alt={item.label} className="w-6 h-6 object-contain opacity-60" />
                </div>
                <span className="text-text-muted text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* bento 1 */}
      <section ref={bentoRef} className={`relative ${sectionCl} py-32 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: `url('/lander-bento-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/85 via-surface/95 to-surface" aria-hidden />
        <div className={`relative ${maxW} transition-all duration-700 ${bentoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>how it works</p>
          <h2 className={headingCl}>one prompt. full project.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 [grid-auto-rows:minmax(140px,auto)]">
            {BENTO_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`${item.span} ${cardCl} rounded-lg p-6 flex flex-col justify-between transition-all duration-300 ${bentoVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <i className={`ph ${item.icon} text-lg text-text-muted mb-3 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* steps */}
      <section ref={stepsRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>process</p>
          <h2 className={headingCl}>three steps. zero friction.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {STEPS.map((step, i) => (
              <div key={i} className={`${cardCl} rounded-lg p-8 transition-all duration-300 ${stepsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="text-2xl font-medium text-text-muted">{step.num}</span>
                <div className="mt-4 flex items-center gap-2">
                  <i className={`ph ${step.icon} text-lg text-text-muted`}></i>
                  <h3 className="text-sm font-medium text-text-primary">{step.label}</h3>
                </div>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* comparison */}
      <section ref={comparisonRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${comparisonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>the difference</p>
          <h2 className={headingCl}>traditional vs jasmine</h2>
          <div className={`${cardCl} rounded-lg overflow-hidden mt-16`}>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-inherit">
              <div className="p-8">
                <p className="text-xs text-text-muted mb-4">traditional</p>
                <ul className="space-y-3">
                  {COMPARISON.map((c, i) => (
                    <li key={i} className="text-text-secondary text-sm">{c.traditional}</li>
                  ))}
                </ul>
              </div>
              <div className="p-8 flex items-center justify-center">
                <i className="ph ph-arrow-right text-lg text-text-muted" />
              </div>
              <div className="p-8">
                <p className="text-xs text-[var(--color-accent)] mb-4">jasmine</p>
                <ul className="space-y-3">
                  {COMPARISON.map((c, i) => (
                    <li key={i} className="text-text-primary text-sm font-medium">{c.jasmine}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* use cases */}
      <section ref={useCasesRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${useCasesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>industries</p>
          <h2 className={headingCl}>built for every vertical.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {USE_CASES.map((uc, i) => (
              <div key={i} className={`${cardCl} rounded-lg p-6 transition-all duration-300 ${useCasesVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 60}ms` }}>
                <i className={`ph ${uc.icon} text-lg text-text-muted mb-2 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{uc.label}</h3>
                <p className="text-xs text-text-secondary">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* bento 2 */}
      <section ref={bento2Ref} className={`relative ${sectionCl} py-32 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: `url('/lander-bento-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/85 via-surface/95 to-surface" aria-hidden />
        <div className={`relative ${maxW} transition-all duration-700 ${bento2Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>output quality</p>
          <h2 className={headingCl}>world-class. every time.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 [grid-auto-rows:minmax(120px,auto)]">
            {BENTO_OUTPUT.map((item, i) => (
              <div key={i} className={`${item.span} ${cardCl} rounded-lg p-6 flex flex-col justify-between transition-all duration-300 ${bento2Visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 60}ms` }}>
                <i className={`ph ${item.icon} text-lg text-text-muted mb-2 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* testimonial */}
      <section ref={carouselRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${carouselVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>what people say</p>
          <h2 className={headingCl}>built for designers who care.</h2>
          <div className="relative min-h-[240px] mt-16">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`transition-all duration-500 ${i === carouselIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute inset-x-0 top-0 pointer-events-none'}`}>
                <blockquote className={`${cardCl} rounded-lg p-10 md:p-14`}>
                  <p className="text-xl md:text-2xl font-medium text-text-primary leading-[1.4] mb-6">"{t.quote}"</p>
                  <p className="text-sm text-text-muted">{t.author} · {t.role}</p>
                </blockquote>
              </div>
            ))}
            <div className="flex gap-2 mt-8 justify-center">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setCarouselIndex(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? 'bg-text-primary w-6' : 'bg-white/20 w-1.5 hover:bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* horizontal features */}
      <section ref={horizontalRef} className={`py-32 border-t ${borderCl}`}>
        <div className={`transition-all duration-700 ${horizontalVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className={`${sectionCl} mb-16`}>
            <p className={labelCl}>built-in craft</p>
            <h2 className={headingCl}>every detail, handled.</h2>
          </div>
          <div className="relative overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide">
            <div className="flex gap-4 w-max pl-6 md:pl-24 pr-6 md:pr-24">
              {HORIZONTAL_FEATURES.map((f, i) => (
                <div key={i} className={`shrink-0 w-[260px] ${cardCl} rounded-lg p-6 transition-all duration-300 ${horizontalVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 50}ms` }}>
                  <i className={`ph ${f.icon} text-lg text-text-muted mb-2 block`}></i>
                  <h3 className="text-sm font-medium text-text-primary mb-1">{f.title}</h3>
                  <p className="text-xs text-text-secondary">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* example cards */}
      <section ref={cardsRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>try these</p>
          <h2 className={headingCl}>one click to start.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {EXAMPLE_CARDS.map((card, i) => (
              <div key={i} className={`${cardCl} rounded-lg p-6 flex flex-col transition-all duration-300 hover:border-accent/30 ${cardsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 50}ms` }}>
                <span className="text-xs text-text-muted">{card.label}</span>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed flex-1">{card.desc}</p>
                <button onClick={() => onSelectPrompt(card.prompt)} className="btn-premium mt-4 w-full py-2.5 rounded-md flex items-center justify-center gap-2 text-sm">
                  <i className="ph ph-magic-wand text-base"></i>
                  try it
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section ref={valueRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} text-center transition-all duration-700 ${valueVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>pricing</p>
          <h2 className={headingCl}>free forever.</h2>
          <p className="text-base text-text-secondary mb-12 max-w-md mx-auto">
            no signup. no credit card. generate as many projects as you want. the code is yours.
          </p>
          <div className={`${cardCl} rounded-lg p-12 inline-block`}>
            <p className="text-3xl font-medium text-text-primary">$0</p>
            <p className="text-xs text-text-muted mt-1">per month</p>
          </div>
        </div>
      </section>

      {/* faq */}
      <section ref={faqRef} className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <div className={`${maxW} transition-all duration-700 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className={labelCl}>faq</p>
          <h2 className={headingCl}>questions? answers.</h2>
          <div className="space-y-2 mt-16">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`${cardCl} rounded-lg overflow-hidden transition-all duration-300 ${faqVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 60}ms` }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-text-primary">{item.q}</span>
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

      {/* cta */}
      <section ref={ctaRef} className={`${sectionCl} py-40 border-t ${borderCl}`}>
        <div className={`${maxW} text-center transition-all duration-700 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className={headingCl}>ready to design?</h2>
          <p className="text-base text-text-secondary mb-12">the world's best designer. one prompt.</p>
          <button onClick={onStartDesigning} className="btn-premium inline-flex items-center gap-2 text-sm px-10 py-3">
            <i className="ph ph-rocket-launch text-base"></i>
            start designing
          </button>
        </div>
      </section>

      {/* footer */}
      <footer className={`${sectionCl} py-20 border-t ${borderCl}`}>
        <div className={`${maxW} flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-medium text-text-primary">jasmine</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>ai website designer</span>
            <span>·</span>
            <span>vite · react · tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
