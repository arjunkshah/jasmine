import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import BlurPopUp from './components/BlurPopUp';
import BlurPopUpInView from './components/BlurPopUpInView';
import HeroGlowLines from './components/HeroGlowLines';
import { heroContainer, heroItem } from './lib/animations';

const BENTO_ITEMS = [
  { span: 'md:col-span-2 md:row-span-2', icon: 'ph-magic-wand', title: 'world\'s best designer', desc: 'law firms, restaurants, saas, portfolios. one prompt. jasmine crafts it.' },
  { span: '', icon: 'ph-rocket-launch', title: 'kimi k2.5', desc: 'default via ai gateway' },
  { span: '', icon: 'ph-palette', title: 'gemini', desc: 'creative depth' },
  { span: '', icon: 'ph-sparkle', title: 'gpt 5.4', desc: 'via ai gateway' },
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
  { q: 'how does it work?', a: 'describe what you want in one prompt. jasmine — the world\'s best designer — uses Kimi K2.5 (default), Gemini, or GPT 5.4 via Vercel AI Gateway. edit in real time, download or deploy to Netlify.' },
  { q: 'is it really free?', a: 'yes. generate and export as many projects as you want. no signup, no credit card required.' },
  { q: 'can i use the output commercially?', a: 'absolutely. the code you generate is yours.' },
];

const EXAMPLE_CARDS = [
  { label: 'law firm', desc: 'professional landing — practice areas, team bios. trustworthy.', prompt: 'Complete law firm website — home (5+ sections: hero, practice areas, team, testimonials, CTA, footer), about, practice areas grid, team bios, contact. Professional, trustworthy, premium typography. Apply UI tips: layered shadows, tight tracking, 60-30-10 color, generous whitespace. World-class polish.' },
  { label: 'saas', desc: 'developer tool landing — dark mode, feature grid, pricing.', prompt: 'Complete SaaS site for a dev tool — home (5+ sections: hero, features, social proof, pricing, CTA, footer), features, pricing, docs, dashboard. Dark mode, Vercel-inspired. Apply UI tips: depth, micro-interactions, bento grids. Every page complete.' },
  { label: 'restaurant', desc: 'menu section, reservation cta. warm, appetizing.', prompt: 'Complete restaurant website — home (5+ sections: hero, menu preview, about, testimonials, reservations CTA, footer), full menu, reservations, about, contact. Warm, appetizing. Apply UI tips: visual rhythm, typography pairing, conversion elements.' },
  { label: 'gaming studio', desc: 'bold gradients, game showcase. high-energy.', prompt: 'Complete gaming studio site — home (5+ sections: hero, games showcase, team, stats, CTA, footer), games, team, careers, contact. Bold, high-energy. Apply UI tips: asymmetric grids, gradients with purpose, staggered reveals.' },
  { label: 'meditation app', desc: 'soft, calming. testimonial carousel.', prompt: 'Complete meditation app site — home (5+ sections: hero, features, testimonial carousel, pricing, download CTA, footer). Soft, calming. Apply UI tips: muted palette, blur-to-reveal, single clear CTA per section.' },
  { label: 'creative agency', desc: 'dark editorial, case studies.', prompt: 'Complete creative agency portfolio — home (5+ sections: hero, case studies, services, testimonials, CTA, footer), case studies, about, services, contact. Dark editorial. Apply UI tips: asymmetric layout, depth, premium typography.' },
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

const sectionCl = 'px-6 md:px-12 lg:px-24';
const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
const maxW = 'max-w-4xl mx-auto';

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/hero-bg.png')` }}
        />
        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-b from-transparent via-surface/40 to-surface' : 'bg-gradient-to-b from-black/40 via-surface/75 to-surface'}`} />
        <HeroGlowLines />
        <div className={`relative ${maxW} w-full`}>
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
            <div className={!isLight ? '[text-shadow:0_1px_2px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.4)]' : ''}>
              <BlurPopUp delay={0}>
                <p className={`${labelCl} font-display text-3d`}>the world's best designer</p>
              </BlurPopUp>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.1] text-text-primary mb-6 font-display text-3d">
                <BlurPopUpByWord text="design anything." wordDelay={0.05} />
              </h1>
              <BlurPopUp delay={0.6}>
                <p className={`text-base md:text-lg leading-[1.6] max-w-lg mb-12 ${isLight ? 'text-text-secondary' : 'text-text-secondary [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'}`}>
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
              <div className={`${cardCl} rounded-lg p-6 overflow-hidden ${!isLight ? 'shadow-[0_4px_24px_rgba(0,0,0,0.5)]' : ''}`}>
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
      <section className={`relative py-24 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('/lander-stats-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/85 to-surface" aria-hidden />
        <motion.div
          className={`relative ${maxW} ${sectionCl}`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 md:gap-24">
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={heroItem} className="text-center">
                <p className="text-2xl md:text-3xl font-medium text-text-primary tracking-tight">{stat.value}</p>
                <p className="text-xs text-text-muted mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* marquee */}
      <section className={`py-24 border-t ${borderCl} overflow-hidden`}>
        <BlurPopUpInView>
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
        </BlurPopUpInView>
      </section>

      {/* bento 1 */}
      <section className={`relative ${sectionCl} py-32 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('/lander-bento-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/85 to-surface" aria-hidden />
        <motion.div
          className={`relative ${maxW}`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.05 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>how it works</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>one prompt. full project.</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 [grid-auto-rows:minmax(140px,auto)]">
            {BENTO_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                variants={heroItem}
                className={`${item.span} ${cardCl} rounded-lg p-6 flex flex-col justify-between`}
              >
                <i className={`ph ${item.icon} text-lg text-text-muted mb-3 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* steps */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <motion.div
          className={maxW}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>process</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>three steps. zero friction.</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {STEPS.map((step, i) => (
              <motion.div key={i} variants={heroItem} className={`${cardCl} rounded-lg p-8`}>
                <span className="text-2xl font-medium text-text-muted">{step.num}</span>
                <div className="mt-4 flex items-center gap-2">
                  <i className={`ph ${step.icon} text-lg text-text-muted`}></i>
                  <h3 className="text-sm font-medium text-text-primary">{step.label}</h3>
                </div>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* comparison */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <motion.div
          className={maxW}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>the difference</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>traditional vs jasmine</motion.h2>
          <motion.div variants={heroItem} className={`${cardCl} rounded-lg overflow-hidden mt-16`}>
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
          </motion.div>
        </motion.div>
      </section>

      {/* use cases */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <motion.div
          className={maxW}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>industries</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>built for every vertical.</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {USE_CASES.map((uc, i) => (
              <motion.div key={i} variants={heroItem} className={`${cardCl} rounded-lg p-6`}>
                <i className={`ph ${uc.icon} text-lg text-text-muted mb-2 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{uc.label}</h3>
                <p className="text-xs text-text-secondary">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* bento 2 */}
      <section className={`relative ${sectionCl} py-32 border-t ${borderCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('/lander-bento-bg.png')` }} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/85 to-surface" aria-hidden />
        <motion.div
          className={`relative ${maxW}`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.05 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>output quality</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>world-class. every time.</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 [grid-auto-rows:minmax(120px,auto)]">
            {BENTO_OUTPUT.map((item, i) => (
              <motion.div key={i} variants={heroItem} className={`${item.span} ${cardCl} rounded-lg p-6 flex flex-col justify-between`}>
                <i className={`ph ${item.icon} text-lg text-text-muted mb-2 block`}></i>
                <h3 className="text-sm font-medium text-text-primary mb-1">{item.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* testimonial */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <BlurPopUpInView className={maxW}>
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
        </BlurPopUpInView>
      </section>

      {/* horizontal features */}
      <section className={`py-32 border-t ${borderCl}`}>
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <div className={`${sectionCl} mb-16`}>
            <motion.p variants={heroItem} className={labelCl}>built-in craft</motion.p>
            <motion.h2 variants={heroItem} className={headingCl}>every detail, handled.</motion.h2>
          </div>
          <div className="relative overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide">
            <div className="flex gap-4 w-max pl-6 md:pl-24 pr-6 md:pr-24">
              {HORIZONTAL_FEATURES.map((f, i) => (
                <motion.div key={i} variants={heroItem} className={`shrink-0 w-[260px] ${cardCl} rounded-lg p-6`}>
                  <i className={`ph ${f.icon} text-lg text-text-muted mb-2 block`}></i>
                  <h3 className="text-sm font-medium text-text-primary mb-1">{f.title}</h3>
                  <p className="text-xs text-text-secondary">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* example cards */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <motion.div
          className={maxW}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>try these</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>one click to start.</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {EXAMPLE_CARDS.map((card, i) => (
              <motion.div key={i} variants={heroItem} className={`${cardCl} rounded-lg p-6 flex flex-col hover:border-accent/30`}>
                <span className="text-xs text-text-muted">{card.label}</span>
                <p className="text-text-secondary text-sm mt-2 leading-relaxed flex-1">{card.desc}</p>
                <button onClick={() => onSelectPrompt(card.prompt)} className="btn-premium mt-4 w-full py-2.5 rounded-md flex items-center justify-center gap-2 text-sm">
                  <i className="ph ph-magic-wand text-base"></i>
                  try it
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* pricing */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <BlurPopUpInView className={`${maxW} text-center`}>
          <p className={labelCl}>pricing</p>
          <h2 className={headingCl}>free forever.</h2>
          <p className="text-base text-text-secondary mb-12 max-w-md mx-auto">
            no signup. no credit card. generate as many projects as you want. the code is yours.
          </p>
          <div className={`${cardCl} rounded-lg p-12 inline-block`}>
            <p className="text-3xl font-medium text-text-primary">$0</p>
            <p className="text-xs text-text-muted mt-1">per month</p>
          </div>
        </BlurPopUpInView>
      </section>

      {/* faq */}
      <section className={`${sectionCl} py-32 border-t ${borderCl}`}>
        <motion.div
          className={maxW}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.p variants={heroItem} className={labelCl}>faq</motion.p>
          <motion.h2 variants={heroItem} className={headingCl}>questions? answers.</motion.h2>
          <div className="space-y-2 mt-16">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={i} variants={heroItem} className={`${cardCl} rounded-lg overflow-hidden`}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-text-primary">{item.q}</span>
                  <i className={`ph ph-caret-down text-text-muted transition-transform duration-200 ${faqOpen === i ? 'rotate-180' : ''}`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faqOpen === i ? 'max-h-48' : 'max-h-0'}`}>
                  <p className="px-6 pb-4 text-text-secondary text-sm leading-relaxed">{item.a}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* cta */}
      <section className={`${sectionCl} py-40 border-t ${borderCl}`}>
        <BlurPopUpInView className={`${maxW} text-center`} amount={0.2}>
          <h2 className={headingCl}>ready to design?</h2>
          <p className="text-base text-text-secondary mb-12">the world's best designer. one prompt.</p>
          <button onClick={onStartDesigning} className="btn-premium inline-flex items-center gap-2 text-sm px-10 py-3">
            <i className="ph ph-rocket-launch text-base"></i>
            start designing
          </button>
        </BlurPopUpInView>
      </section>

      {/* footer */}
      <footer className={`${sectionCl} py-20 border-t ${borderCl}`}>
        <BlurPopUpInView className={`${maxW} flex flex-col md:flex-row items-center justify-between gap-6`}>
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
        </BlurPopUpInView>
      </footer>
    </div>
  );
}

export default LandingPage;
