import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { heroContainer, heroItem } from './lib/animations';
import AmbientLighting from './components/AmbientLighting';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import BlurPopUpByWordInView from './components/BlurPopUpByWordInView';

const FEATURE_SETS = [
  {
    title: 'Design, generate, iterate',
    desc: 'Describe your product once. Jasmine drafts layouts, sections, interactions, and polish in the same UI.',
    icon: 'ph-sparkle',
  },
  {
    title: 'Chat-native edits',
    desc: 'Ask for tweaks like “make the hero tighter” or “add pricing”. Jasmine updates the project instantly.',
    icon: 'ph-chat-circle-dots',
  },
  {
    title: 'Production output',
    desc: 'React, Tailwind, TypeScript, sensible structure, and assets ready to ship or download.',
    icon: 'ph-rocket-launch',
  },
];

const WORKSPACES = [
  { title: 'Research', desc: 'Capture references, competitive notes, and inspiration in one place.', icon: 'ph-notebook' },
  { title: 'Wireframe', desc: 'Rough layouts turn into polished sections with Jasmine’s taste.', icon: 'ph-layout' },
  { title: 'Ship', desc: 'Preview, download, or deploy the generated project without leaving the page.', icon: 'ph-cloud-arrow-down' },
];

const EXAMPLE_CARDS = [
  { label: 'Law firm', desc: 'Premium, trustworthy hero + practice areas.', prompt: 'Complete law firm website — home (hero, practice areas grid, testimonials, CTA, footer), about, team, contact. Premium serif, navy + gold, editorial spacing.' },
  { label: 'SaaS', desc: 'Dark, Vercel-inspired feature grid.', prompt: 'Complete SaaS site — home (hero, highlights, social proof, pricing, CTA, footer), features, pricing, docs, dashboard. Dark UI, modern micro-interactions.' },
  { label: 'Restaurant', desc: 'Warm menu + reservation CTA.', prompt: 'Complete restaurant site — home (hero, menu preview, about, testimonials, reservation CTA, footer), full menu, reservations, contact. Warm palette, appetizing photography placeholders.' },
  { label: 'Agency', desc: 'Editorial, case studies forward.', prompt: 'Creative agency site — home (hero, case studies, services, testimonials, CTA, footer), work, services, about, contact. Editorial typography, asymmetric layout.' },
  { label: 'Gaming', desc: 'High-energy, gradient spotlight.', prompt: 'Gaming studio site — home (hero, featured games, stats, team, CTA, footer), games, team, careers. Bold gradients, energetic motion.' },
  { label: 'Wellness', desc: 'Soft, calming landing.', prompt: 'Meditation app site — home (hero, features, testimonial carousel, pricing, download CTA, footer). Soft palette, calm rhythm.' },
];

const STEPS = [
  { title: 'Describe', desc: 'One sentence about the product, vibe, and pages you need.' },
  { title: 'Generate', desc: 'Jasmine drafts the entire project: structure, sections, spacing, interactions.' },
  { title: 'Refine', desc: 'Chat to adjust copy, layout, and styling. Preview or download instantly.' },
];

const STOP_JUGGLING_ITEMS = [
  { title: 'Notes', desc: 'Capture references, competitive notes, and inspiration in one place.', icon: 'ph-note-pencil' },
  { title: 'Design', desc: 'Describe your product. Jasmine drafts layouts, sections, and polish.', icon: 'ph-palette' },
  { title: 'Chat', desc: 'Ask for tweaks. "Make the hero tighter" or "add pricing" — instant updates.', icon: 'ph-chat-circle-dots' },
  { title: 'Preview', desc: 'Live preview, download, or deploy without leaving the page.', icon: 'ph-browser' },
  { title: 'Export', desc: 'React, Tailwind, TypeScript — production-ready code.', icon: 'ph-file-code' },
];

const TESTIMONIALS = [
  { quote: "I've never shipped a landing page this fast. Jasmine gets the craft right.", author: 'Alex', role: 'Founder' },
  { quote: 'The chat edits are magic. One sentence and the whole section updates.', author: 'Sam', role: 'Designer' },
  { quote: 'Finally, an AI that outputs code I\'d actually ship.', author: 'Jordan', role: 'Engineer' },
];

function VerticalStepBlock({ step, idx, isLight, borderCl }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      className={`min-h-[70vh] flex items-center border-t ${borderCl} px-6 md:px-12 lg:px-20`}
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, x: -48 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={`inline-flex h-14 w-14 md:h-20 md:w-20 rounded-2xl items-center justify-center text-2xl font-bold ${isLight ? 'bg-neutral-100 text-neutral-800 border border-neutral-200' : 'bg-white/10 text-text-primary border border-white/10'}`}>
            {`0${idx + 1}`}
          </span>
        </motion.div>
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted mb-3">Step</p>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.02em] text-text-primary mb-4">
            <BlurPopUpByWordInView text={step.title} wordDelay={0.04} />
          </h3>
          <p className="text-text-secondary leading-[1.7] text-lg">
            <BlurPopUpByWordInView text={step.desc} wordDelay={0.02} />
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function StopJugglingSection({ isLight, borderCl }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const cellCl = isLight ? 'bg-white border-neutral-200' : 'bg-white/[0.04] border-white/10';

  return (
    <section ref={ref} className={`relative overflow-hidden px-6 md:px-12 lg:px-20 py-24 md:py-32 border-t ${borderCl}`}>
      <div className="absolute inset-0 pointer-events-none">
        <img src="/auth-bg.png" alt="" className={`w-full h-full object-cover object-center ${isLight ? 'opacity-[0.06]' : 'opacity-[0.04]'}`} />
      </div>
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge>Everything in one canvas</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mt-4 mb-4">
            <BlurPopUpByWordInView text="Stop juggling five different apps." wordDelay={0.03} />
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            <BlurPopUpByWordInView text="Notes, design, chat, preview, export — Jasmine keeps it all in one place." wordDelay={0.02} />
          </p>
        </motion.div>
        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {STOP_JUGGLING_ITEMS.map((item, idx) => (
            <motion.div
              key={item.title}
              className={`rounded-xl border p-6 ${cellCl}`}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <i className={`ph ${item.icon} text-2xl mb-3 block ${isLight ? 'text-neutral-600' : 'text-white/70'}`} />
              <h3 className="font-semibold text-text-primary">{item.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ isLight, borderCl }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const cardCl = isLight ? 'bg-white border-neutral-200' : 'bg-white/[0.04] border-white/10';

  return (
    <section ref={ref} className={`relative overflow-hidden px-6 md:px-12 lg:px-20 py-24 md:py-32 border-t ${borderCl}`}>
      <div className="absolute inset-0 pointer-events-none">
        <img src="/og-image.png" alt="" className={`w-full h-full object-cover object-center ${isLight ? 'opacity-[0.05]' : 'opacity-[0.03]'}`} />
      </div>
      <div className="relative max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge>What people say</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mt-4">
            <BlurPopUpByWordInView text="Built for how you ship." wordDelay={0.03} />
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.author}
              className={`rounded-xl border p-6 md:p-8 ${cardCl}`}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-text-secondary leading-relaxed italic">"{t.quote}"</p>
              <p className="mt-4 font-semibold text-text-primary">{t.author}</p>
              <p className="text-sm text-text-muted">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ isLight, borderCl }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const stats = [
    { value: '20s', label: 'Avg. generation' },
    { value: '6+', label: 'Layout presets' },
    { value: '1', label: 'Prompt to ship' },
  ];

  return (
    <section ref={ref} className={`relative overflow-hidden border-t ${borderCl}`}>
      <div className="absolute inset-0 pointer-events-none">
        <img src="/lander-stats-bg.png" alt="" className={`w-full h-full object-cover object-center ${isLight ? 'opacity-[0.12]' : 'opacity-[0.08]'}`} />
      </div>
      <div className="relative max-w-4xl mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28">
        <motion.div
          className="grid grid-cols-3 gap-8 md:gap-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {stats.map((s, idx) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">{s.value}</p>
              <p className="text-sm text-text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function IdeasSection({ isLight, onStartDesigning }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className={`relative overflow-hidden px-6 md:px-12 lg:px-20 py-24 md:py-32 border-t ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
      <div className="absolute inset-0 pointer-events-none">
        <img src="/auth-bg.png" alt="" className={`w-full h-full object-cover object-center ${isLight ? 'opacity-[0.05]' : 'opacity-[0.03]'}`} />
      </div>
      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-4">
          <BlurPopUpByWordInView text="Your ideas deserve better tools." wordDelay={0.03} />
        </h2>
        <p className="text-text-secondary leading-[1.6] mb-8">
          <BlurPopUpByWordInView text="No matter what you're building, Jasmine is where it all comes together." wordDelay={0.02} />
        </p>
        <motion.button
          onClick={onStartDesigning}
          className="btn-premium flex items-center gap-2 mx-auto"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className="ph ph-magic-wand text-lg" />
          Start designing
        </motion.button>
      </motion.div>
    </section>
  );
}

function StackedCardsSection({ isLight, onSelectPrompt, exampleCards }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const cards = exampleCards.slice(0, 4);
  const cardBase = isLight ? 'bg-white border-neutral-200 shadow-lg' : 'bg-white/[0.06] border-white/10 shadow-xl';

  return (
    <section ref={ref} className="px-6 md:px-12 lg:px-20 py-24 md:py-28">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge>Layout presets</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mt-4 mb-4">
            <BlurPopUpByWordInView text="Pick a prompt, watch it land." wordDelay={0.03} />
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            <BlurPopUpByWordInView text="Cards cascade into place — law firm, SaaS, restaurant, agency. One click and you're designing." wordDelay={0.02} />
          </p>
        </motion.div>
        <div className="relative h-[320px] md:h-[380px] flex items-center justify-center">
          {cards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 60, rotate: -4 + idx * 2 }}
              animate={inView ? { opacity: 1, y: idx * 12, rotate: -4 + idx * 2 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute w-[85%] max-w-md rounded-2xl border p-6 cursor-pointer hover:scale-[1.02] hover:z-10 transition-transform ${cardBase}`}
              style={{ zIndex: idx, top: `${20 + idx * 14}%`, left: `${10 + idx * 4}%` }}
              onClick={() => onSelectPrompt(card.prompt)}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-primary'}`}>
                  {card.label[0]}
                </span>
                <span className="font-semibold text-text-primary">{card.label}</span>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoSection({ isLight }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const cellCl = isLight ? 'bg-white border-neutral-200' : 'bg-white/[0.04] border-white/10';

  const cells = [
    { span: 'col-span-2 row-span-2', title: 'Hero', desc: 'Badge, headline, CTA, trust bar.', icon: 'ph-sparkle', image: '/lander-bento-bg.png' },
    { span: 'col-span-1', title: 'Features', desc: 'Grid of highlights.', icon: 'ph-squares-four', image: '/og-image.png' },
    { span: 'col-span-1', title: 'Pricing', desc: 'Plans and tiers.', icon: 'ph-currency-dollar' },
    { span: 'col-span-1', title: 'Testimonials', desc: 'Social proof.', icon: 'ph-quotes', image: '/empty-state.png' },
    { span: 'col-span-1', title: 'Footer', desc: 'Links and CTA.', icon: 'ph-link' },
  ];

  return (
    <section ref={ref} className={`relative px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t overflow-hidden ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <img src="/lander-bento-bg.png" alt="" className="w-full h-full object-cover object-center" />
      </div>
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Badge>Bento layout</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mt-4 mb-4">
            <BlurPopUpByWordInView text="Every section, one grid." wordDelay={0.03} />
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            <BlurPopUpByWordInView text="Hero, features, pricing, testimonials — arranged like a bento box. Clean, scannable, conversion-ready." wordDelay={0.02} />
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {cells.map((cell, idx) => (
            <motion.div
              key={cell.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`${cell.span} rounded-xl border overflow-hidden p-0 ${cellCl}`}
            >
              {cell.image ? (
                <>
                  <div className="relative h-32 md:h-40">
                    <img src={cell.image} alt="" className="w-full h-full object-cover object-center" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isLight ? 'from-white to-transparent' : 'from-[var(--color-surface-raised)] to-transparent'}`} />
                  </div>
                  <div className="p-5 md:p-6">
                    <i className={`ph ${cell.icon} text-2xl mb-3 block ${isLight ? 'text-neutral-600' : 'text-white/70'}`} />
                    <h3 className="font-semibold text-text-primary">{cell.title}</h3>
                    <p className="text-sm text-text-secondary mt-1">{cell.desc}</p>
                  </div>
                </>
              ) : (
                <div className="p-5 md:p-6">
                  <i className={`ph ${cell.icon} text-2xl mb-3 block ${isLight ? 'text-neutral-600' : 'text-white/70'}`} />
                  <h3 className="font-semibold text-text-primary">{cell.title}</h3>
                  <p className="text-sm text-text-secondary mt-1">{cell.desc}</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function Card({ children, className = '', isLight }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const PASTEL_CARD_COLORS = [
  'bg-[#B0E0E6]',   /* soft blue */
  'bg-[#FFF9C4]',   /* warm yellow */
  'bg-[#F5F0E8]',   /* light beige */
  'bg-[#FFB6C1]',   /* pastel pink */
  'bg-[#C0F2C0]',   /* mint green */
  'bg-[#E8E6E3]',   /* subtle grey */
];

function LandingPage({ onStartDesigning, onSelectPrompt, theme }) {
  const isLight = theme === 'light';
  const borderCl = useMemo(() => (isLight ? 'border-neutral-200' : 'border-white/10'), [isLight]);
  const mutedBg = isLight ? 'bg-neutral-50' : 'bg-surface-raised';

  return (
    <div className="flex-1 overflow-y-auto bg-surface text-text-primary">
      {/* hero */}
      <section className="relative overflow-hidden px-6 md:px-12 lg:px-20 pt-20 pb-24 md:pb-32">
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/hero-bg.png"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center ${isLight ? 'opacity-[0.08]' : 'opacity-[0.06]'}`}
          />
        </div>
        {isLight && <AmbientLighting isLight={isLight} />}
        {isLight && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-20 -top-32 h-72 w-72 rounded-full blur-3xl bg-neutral-300/30" />
            <div className="absolute right-0 top-10 h-64 w-64 rounded-full blur-3xl bg-neutral-200/50" />
          </div>
        )}
        <motion.div
          className="relative max-w-4xl mx-auto text-center space-y-12"
          variants={heroContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={heroItem}>
            <Badge>Jasmine — the notebook that designs with you</Badge>
          </motion.div>
          <motion.h1 variants={heroItem} className="text-4xl md:text-5xl lg:text-[52px] font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary">
            <BlurPopUpByWord text="Build frontends that feel hand-crafted." wordDelay={0.04} />
          </motion.h1>
          <motion.p variants={heroItem} className="text-lg md:text-xl leading-[1.6] text-text-secondary max-w-2xl mx-auto">
            <BlurPopUpByWord text="Write a prompt. Jasmine composes every page — hero, feature grids, pricing, footers — with the polish of a senior designer. Refine it live, then export production-ready React + Tailwind." wordDelay={0.02} />
          </motion.p>
          <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 w-full sm:w-auto justify-center">
              <i className="ph ph-magic-wand text-lg"></i>
              Start designing
            </button>
            <button onClick={() => onSelectPrompt(EXAMPLE_CARDS[0].prompt)} className="btn-ghost flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-3 text-sm font-semibold">
              Try law firm prompt
              <i className="ph ph-arrow-up-right" />
            </button>
          </motion.div>

          <motion.div variants={heroItem}>
          <Card className="mt-16 overflow-hidden" isLight={isLight}>
            <div className="grid lg:grid-cols-[1.05fr_1fr]">
              <div className={`p-6 md:p-10 border-b lg:border-b-0 lg:border-r text-left space-y-5 ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-secondary'}`}>
                  <i className="ph ph-sparkle" />
                  Canvas
                </div>
                <h3 className="text-xl md:text-2xl font-semibold leading-tight">Homepage layout for “Summit Legal”</h3>
                <ul className="space-y-3 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <i className={`ph ph-check-circle mt-0.5 ${isLight ? 'text-neutral-700' : 'text-text-muted'}`} />
                    Hero with badge, CTA, and trust bar.
                  </li>
                  <li className="flex items-start gap-2">
                    <i className={`ph ph-check-circle mt-0.5 ${isLight ? 'text-neutral-700' : 'text-text-muted'}`} />
                    Practice areas grid with cards and icons.
                  </li>
                  <li className="flex items-start gap-2">
                    <i className={`ph ph-check-circle mt-0.5 ${isLight ? 'text-neutral-700' : 'text-text-muted'}`} />
                    Testimonials, CTA band, editorial footer.
                  </li>
                </ul>
                <div className={`rounded-lg border px-4 py-3 text-sm text-text-primary ${isLight ? 'border-neutral-200 bg-neutral-50' : 'border-white/10 bg-white/5'}`}>
                  “Jasmine, keep the hero tighter and make the CTA button emerald.”
                </div>
              </div>
              <div className={`${mutedBg} p-6 md:p-10 relative`}>
                <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-neutral-500' : 'bg-white/50'}`} />
                    Live preview
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <i className="ph ph-copy" />
                    <i className="ph ph-arrow-square-out" />
                  </div>
                </div>
                <div className={`rounded-lg border overflow-hidden ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                  <img src="/hero-bg.png" alt="Jasmine design preview" className="w-full h-48 object-cover object-top" />
                </div>
                <div className={`rounded-lg border p-4 space-y-3 mt-3 ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <div className={`h-2 w-24 rounded-full ${isLight ? 'bg-neutral-200' : 'bg-white/20'}`} />
                    <div className="flex gap-1">
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center ${isLight ? 'bg-neutral-200 text-neutral-600' : 'bg-white/10 text-text-muted'}`}>
                        <i className="ph ph-play" />
                      </span>
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center ${isLight ? 'bg-neutral-200 text-neutral-500' : 'bg-white/10 text-text-muted'}`}>
                        <i className="ph ph-caret-down" />
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className={`h-10 rounded-lg ${isLight ? 'bg-neutral-100 border border-neutral-200' : 'bg-white/10 border border-white/10'}`} />
                    <div className="grid sm:grid-cols-3 gap-2">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className={`h-28 rounded-lg ${isLight ? 'bg-neutral-100 border border-neutral-200' : 'bg-white/10 border border-white/10'}`} />
                      ))}
                    </div>
                    <div className={`h-14 rounded-lg ${isLight ? 'bg-neutral-100 border border-neutral-200' : 'bg-white/10 border border-white/10'}`} />
                    <div className={`h-10 rounded-lg ${isLight ? 'bg-neutral-100 border border-neutral-200' : 'bg-white/10 border border-white/10'}`} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* stacked cards */}
      <StackedCardsSection isLight={isLight} onSelectPrompt={onSelectPrompt} exampleCards={EXAMPLE_CARDS} />

      {/* bento grid */}
      <BentoSection isLight={isLight} />

      {/* features */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge>Everything in one canvas</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
              <BlurPopUpByWordInView text="Jasmine handles the full flow." wordDelay={0.03} />
            </h2>
            <p className="text-text-secondary text-base md:text-lg leading-[1.6] max-w-2xl mx-auto">
              <BlurPopUpByWordInView text="Ideate, design, and ship from the same surface. No hopping between design files and code." wordDelay={0.02} />
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-6 md:gap-8"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {FEATURE_SETS.map((item, idx) => (
              <Card key={item.title} className={`p-0 flex flex-col overflow-hidden ${idx === 0 ? '' : ''}`} isLight={isLight}>
                {idx === 0 ? (
                  <>
                    <div className="relative h-36 overflow-hidden">
                      <img src="/og-image.png" alt="" className="w-full h-full object-cover object-center" />
                      <div className={`absolute inset-0 bg-gradient-to-t ${isLight ? 'from-white to-transparent' : 'from-[var(--color-surface-raised)] to-transparent'}`} />
                    </div>
                    <div className="p-6 md:p-8 flex flex-col gap-4 flex-1">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-secondary'}`}>
                        <i className={`ph ${item.icon} text-lg`} />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </>
                ) : (
                  <div className="p-6 md:p-8 flex flex-col gap-4 h-full">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-secondary'}`}>
                      <i className={`ph ${item.icon} text-lg`} />
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                )}
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* work modes */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-16 lg:gap-20 items-start">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge>Aligned with how you think</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
              <BlurPopUpByWordInView text="Capture, compose, and deploy." wordDelay={0.03} />
            </h2>
            <p className="text-text-secondary leading-[1.6] max-w-xl">
              <BlurPopUpByWordInView text="Jasmine mirrors the clean, confident layout of Opennote: soft neutrals, precise borders, and clear hierarchy. Your product copy stays yours — the craft comes from Jasmine." wordDelay={0.02} />
            </p>
            <div className="space-y-5">
              {WORKSPACES.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isLight ? 'bg-neutral-100 border border-neutral-200 text-neutral-700' : 'bg-white/10 border border-white/10 text-text-secondary'}`}>
                    <i className={`ph ${item.icon}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
          <Card className="p-8 md:p-10 space-y-6 overflow-hidden" isLight={isLight}>
            <motion.div
              className="flex items-center justify-between text-sm text-text-muted"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>Generation timeline</span>
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <i className="ph ph-lightning" />
                20s avg
              </span>
            </motion.div>
            <div className="space-y-3">
              {['Describe product', 'Jasmine drafts layout', 'Review preview', 'Ship'].map((label, idx) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.05 + idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.span
                    className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm font-semibold ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.08, type: 'spring', stiffness: 200 }}
                  >
                    {idx + 1}
                  </motion.span>
                  <div className={`flex-1 h-[3px] rounded-full overflow-hidden ${isLight ? 'bg-neutral-200' : 'bg-white/20'}`}>
                    <motion.div
                      className={`h-full rounded-full ${isLight ? 'bg-neutral-800' : 'bg-white/60'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${70 - idx * 12}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-secondary w-40">{label}</span>
                </motion.div>
              ))}
            </div>
          </Card>
          </motion.div>
        </div>
      </section>

      {/* examples */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <motion.div
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge>Start from a prompt</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
              <BlurPopUpByWordInView text="Pick a layout, keep your own words." wordDelay={0.03} />
            </h2>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {EXAMPLE_CARDS.map((card, idx) => (
              <Card key={card.label} className={`p-0 flex flex-col gap-0 h-full border-0 shadow-sm overflow-hidden ${PASTEL_CARD_COLORS[idx % PASTEL_CARD_COLORS.length]}`} isLight={isLight}>
                {idx === 0 && (
                  <div className="relative h-28 overflow-hidden">
                    <img src="/lander-bento-bg.png" alt="" className="w-full h-full object-cover object-center" />
                  </div>
                )}
                <div className="p-6 flex flex-col gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold ${isLight ? 'bg-neutral-100 border border-neutral-200 text-neutral-700' : 'bg-white/20 border border-white/20 text-text-primary'}`}>
                    {card.label[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{card.label}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-text-muted">Preset prompt</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{card.desc}</p>
                <button
                  onClick={() => onSelectPrompt(card.prompt)}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-neutral-800 hover:text-neutral-900"
                >
                  Use this prompt <i className="ph ph-arrow-right" />
                </button>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* steps — vertical scroll, hit each step as you scroll */}
      <section className={`border-t ${borderCl}`}>
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-16">
          <motion.div
            className="space-y-4 text-center mb-20"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge>How it flows</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
              <BlurPopUpByWordInView text="From prompt to preview." wordDelay={0.03} />
            </h2>
          </motion.div>
        </div>
        {STEPS.map((step, idx) => (
          <VerticalStepBlock
            key={step.title}
            step={step}
            idx={idx}
            isLight={isLight}
            borderCl={borderCl}
          />
        ))}
      </section>

      {/* OpenNote-style: Stop juggling — feature grid */}
      <StopJugglingSection isLight={isLight} borderCl={borderCl} />

      {/* OpenNote-style: Testimonials */}
      <TestimonialsSection isLight={isLight} borderCl={borderCl} />

      {/* Stats — lander-stats-bg */}
      <StatsSection isLight={isLight} borderCl={borderCl} />

      {/* OpenNote-style: Your ideas deserve better tools */}
      <IdeasSection isLight={isLight} onStartDesigning={onStartDesigning} />

      {/* CTA — OpenNote-style warm yellow footer */}
      <section className="relative overflow-hidden px-6 md:px-12 lg:px-20 py-24 md:py-32 bg-[#FCCD4F] text-[var(--color-text-primary)]">
        <div className="absolute inset-0 pointer-events-none">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover object-center opacity-[0.08]" />
        </div>
        <motion.div
          className="relative max-w-3xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            <BlurPopUpByWordInView text="Start designing today." wordDelay={0.03} />
          </h3>
          <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
            <BlurPopUpByWordInView text="Generate a full project in seconds. Edit with natural language. Download or deploy straight from the canvas." wordDelay={0.02} />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 w-full sm:w-auto justify-center">
              <i className="ph ph-magic-wand text-lg"></i>
              Start designing
            </button>
            <button onClick={() => onSelectPrompt(EXAMPLE_CARDS[1].prompt)} className="btn-ghost flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-3 text-sm font-semibold border-[var(--color-text-primary)] text-[var(--color-text-primary)] hover:bg-black/5">
              Try SaaS prompt
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default LandingPage;
