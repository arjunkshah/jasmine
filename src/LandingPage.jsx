import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { heroContainer, heroItem } from './lib/animations';
import AmbientLighting from './components/AmbientLighting';

const LOGOS = ['YC', 'Harvard', 'Stanford', 'Berkeley', 'MIT', 'UCLA'];

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
        <AmbientLighting isLight={isLight} />
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute -left-20 -top-32 h-72 w-72 rounded-full blur-3xl ${isLight ? 'bg-neutral-300/30' : 'bg-[var(--color-border-subtle)]/40'}`} />
          <div className={`absolute right-0 top-10 h-64 w-64 rounded-full blur-3xl ${isLight ? 'bg-neutral-200/50' : 'bg-[var(--color-surface-overlay)]/60'}`} />
        </div>
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
            Build frontends that feel hand-crafted.
          </motion.h1>
          <motion.p variants={heroItem} className="text-lg md:text-xl leading-[1.6] text-text-secondary max-w-2xl mx-auto">
            Write a prompt. Jasmine composes every page — hero, feature grids, pricing, footers — with the polish of a senior designer. Refine it live, then export production-ready React + Tailwind.
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
              <div className={`${mutedBg} p-6 md:p-10`}>
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
                <div className={`rounded-lg border p-4 space-y-3 ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}>
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
                    <div className={`h-12 rounded-lg ${isLight ? 'bg-neutral-100 border border-neutral-200' : 'bg-white/10 border border-white/10'}`} />
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

      {/* logos */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className={`max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-5 md:gap-8 rounded-xl border px-8 py-6 shadow-sm fade-up ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`} style={{ animationDelay: '0.12s' }}>
          {LOGOS.map((logo) => (
            <div key={logo} className={`text-xs md:text-sm font-semibold tracking-[0.14em] uppercase text-text-muted px-3 py-2 rounded-lg ${isLight ? 'bg-neutral-50 border border-neutral-200' : 'bg-white/5 border border-white/10'}`}>
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="space-y-4 text-center fade-up" style={{ animationDelay: '0.08s' }}>
            <Badge>Everything in one canvas</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Jasmine handles the full flow.</h2>
            <p className="text-text-secondary text-base md:text-lg leading-[1.6] max-w-2xl mx-auto">
              Ideate, design, and ship from the same surface. No hopping between design files and code.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 fade-up" style={{ animationDelay: '0.16s' }}>
            {FEATURE_SETS.map((item) => (
              <Card key={item.title} className="p-6 md:p-8 flex flex-col gap-4 h-full" isLight={isLight}>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-secondary'}`}>
                  <i className={`ph ${item.icon} text-lg`} />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* work modes */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-16 lg:gap-20 items-start">
          <div className="space-y-6 fade-up" style={{ animationDelay: '0.08s' }}>
            <Badge>Aligned with how you think</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Capture, compose, and deploy.</h2>
            <p className="text-text-secondary leading-[1.6] max-w-xl">
              Jasmine mirrors the clean, confident layout of Opennote: soft neutrals, precise borders, and clear hierarchy. Your product copy stays yours — the craft comes from Jasmine.
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
          </div>
          <Card className="p-8 md:p-10 space-y-6 fade-up" isLight={isLight} style={{ animationDelay: '0.16s' }}>
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Generation timeline</span>
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <i className="ph ph-lightning" />
                20s avg
              </span>
            </div>
            <div className="space-y-3">
              {['Describe product', 'Jasmine drafts layout', 'Review preview', 'Ship'].map((label, idx) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-full border flex items-center justify-center text-sm font-semibold ${isLight ? 'border-neutral-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                    {idx + 1}
                  </span>
                    <div className={`flex-1 h-[3px] rounded-full ${isLight ? 'bg-neutral-200' : 'bg-white/20'}`}>
                    <div className={`h-full rounded-full ${isLight ? 'bg-neutral-800' : 'bg-white/60'}`} style={{ width: `${70 - idx * 12}%` }} />
                  </div>
                  <span className="text-sm font-medium text-text-secondary w-40">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* examples */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4 text-center fade-up" style={{ animationDelay: '0.08s' }}>
            <Badge>Start from a prompt</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Pick a layout, keep your own words.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 fade-up" style={{ animationDelay: '0.16s' }}>
            {EXAMPLE_CARDS.map((card, idx) => (
              <Card key={card.label} className={`p-6 flex flex-col gap-4 h-full border-0 shadow-sm ${PASTEL_CARD_COLORS[idx % PASTEL_CARD_COLORS.length]}`} isLight={isLight}>
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* steps */}
      <section className={`px-6 md:px-12 lg:px-20 py-24 md:py-28 border-t ${borderCl}`}>
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="space-y-4 text-center fade-up" style={{ animationDelay: '0.08s' }}>
            <Badge>How it flows</Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">From prompt to preview.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 fade-up" style={{ animationDelay: '0.16s' }}>
            {STEPS.map((step, idx) => (
              <Card key={step.title} className="p-6 md:p-8 space-y-4" isLight={isLight}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                  <span className={`h-7 w-7 rounded-full flex items-center justify-center ${isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/10 text-text-secondary'}`}>{`0${idx + 1}`}</span>
                  Step
                </div>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — OpenNote-style warm yellow footer */}
      <section className="px-6 md:px-12 lg:px-20 py-24 md:py-32 bg-[#FCCD4F] text-[var(--color-text-primary)]">
        <div className="max-w-3xl mx-auto text-center space-y-8 fade-up" style={{ animationDelay: '0.08s' }}>
          <h3 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Start designing today.</h3>
          <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
            Generate a full project in seconds. Edit with natural language. Download or deploy straight from the canvas.
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
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
