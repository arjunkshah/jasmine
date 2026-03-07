import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import BlurPopUpByWord from '../components/BlurPopUpByWord';
import BlurPopUpByWordInView from '../components/BlurPopUpByWordInView';
import BlurPopUpInView from '../components/BlurPopUpInView';
import HeroGlowLines from '../components/HeroGlowLines';
import { heroContainer, heroItem } from '../lib/animations';

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const POSTS = [
  {
    title: 'ai design playbook: conversion-first hero flows',
    summary: 'how jasmine frames the first 8 seconds: contrasty hero, crisp social proof, and a single action that makes ai output feel like a senior art director touched it.',
    author: 'jasmine studio',
    date: '2026-03-05',
    readTime: '7 min read',
    tags: ['conversion', 'landing page', 'hero'],
    keywords: ['ai design playbook', 'conversion hero', 'jasmine ai designer', 'landing page seo'],
    slug: 'ai-design-playbook-conversion-first-hero-flows',
    content: [
      { heading: 'what changed in march 2026', body: 'we re-tested 120 heros in jasmine previews and saw a 22% lift when we paired a single CTA with 2-3 short proof chips. this post shows the exact layout and prompt that shipped.' },
      {
        heading: 'ship it in jasmine',
        bullets: [
          'pick the "hero-first bento" prompt, keep one CTA, and add 2-3 short proof lines (logos or metrics).',
          'lock the header contrast: dark text on light or vice versa; avoid gradient-on-gradient for clarity.',
          'add a thin utility bar with key numbers — we use "4.9/5 from 180 founders" above the fold.',
        ],
      },
      { heading: 'quality bar', body: 'only publish if the hero headline, proof row, and CTA align. if any of those drift, regenerate the hero only, not the whole page.' },
      { heading: 'pattern you can reuse', body: 'stack: headline (pain → fix), single CTA, micro proof row (logos), and a 3-card bento showing feature, outcome, and social proof. the post links the exact prompt wording so you can copy/paste it into jasmine.' },
    ],
  },
  {
    title: 'seo-perfect layouts without the slop',
    summary: 'semantic sections, og tags, lighthouse-friendly spacing, and copy that reads like a strategist wrote it. jasmine ships pages search engines and humans love.',
    author: 'jasmine studio',
    date: '2026-02-27',
    readTime: '6 min read',
    tags: ['seo', 'semantic html', 'content'],
    keywords: ['seo ai website', 'semantic html', 'structured data', 'ai blog jasmine'],
    slug: 'seo-perfect-layouts-without-the-slop',
    content: [
      { heading: 'recent audits', body: 'we ran lighthouse + ahrefs on 30 jasmine exports. biggest wins: semantic <section> landmarks, focused h1/h2 hierarchy, and keeping CLS under 0.04 with predictable media sizing.' },
      {
        heading: 'apply inside jasmine',
        bullets: [
          'turn on the seo preset: title + description + og tags already scaffolded.',
          'keep one h1, then short h2s for each section (hero, features, proof, faq).',
          'add schema: use the json-ld block from the seo sidebar when you export.',
        ],
      },
      { heading: 'common fixes', bullets: ['remove duplicate CTAs above the fold', 'trim copy to 45-65 chars per line on desktop', 'always set explicit widths/heights on hero art to avoid layout shift'] },
      { heading: 'content angle that ranks', body: 'write like a strategist, not an engineer: state the audience, the pain, the proof, and the next action in 2 sentences. sprinkle intent keywords into the hero and first feature card. the article includes a 140-word starter you can edit inside jasmine.' },
      { heading: 'shipping checklist', bullets: ['og:image + twitter:image set to 1200x630', 'meta description under 155 chars with 1 keyword', 'faq section uses <details> so it is crawlable and accessible'] },
    ],
  },
  {
    title: 'design systems: jasmine + tailwind = production',
    summary: 'why we pair jasmine with tailwind tokens, motion primitives, and phosphor icons so the code you export is ready for real teams.',
    author: 'jasmine studio',
    date: '2026-02-19',
    readTime: '8 min read',
    tags: ['design systems', 'tailwind', 'code quality'],
    keywords: ['tailwind ai designer', 'design system ai', 'jasmine components', 'production-ready ui'],
    slug: 'design-systems-jasmine-tailwind-production',
    content: [
      { heading: 'system checklist', body: 'type ramps, spacing scale, and tokens come first. this article maps jasmine components to tailwind primitives so handoff is smooth.' },
      {
        heading: 'runbook',
        bullets: [
          'lock your palette + typography before generation (tailwind config import).',
          'swap icons for phosphor set from the system tab for consistent stroke weight.',
          'export the component list and share it with eng — no mystery class names.',
        ],
      },
      { heading: 'handoff proof', body: 'we include a before/after diff from a recent production deploy to show how minimal the engineer edits were after jasmine generation.' },
      { heading: 'tokens that matter', bullets: ['use a 4px-based spacing scale; avoid random px values', 'define font sizes + leading once, then reuse via utility classes', 'keep shadows and radii consistent; we recommend 4/8/16 radii only'] },
      { heading: 'eng alignment', body: 'drop the exported component list into your PRD. attach the tailwind config and the set of icons used so engineers do not chase assets. the post shows the exact checklist we hand to devs.' },
    ],
  },
  {
    title: 'brand voice with ai that actually feels on-voice',
    summary: 'tone ladders, microcopy swaps, and palette pivots that keep ai from sounding generic. jasmine keeps the personality intact.',
    author: 'jasmine studio',
    date: '2026-02-10',
    readTime: '5 min read',
    tags: ['brand', 'microcopy', 'voice'],
    keywords: ['brand voice ai', 'microcopy ai', 'jasmine brand design', 'ai copywriting design'],
    slug: 'brand-voice-with-ai-that-actually-feels-on-voice',
    content: [
      { heading: 'voice calibration', body: 'we start with a tone ladder (spare → warm → playful) and lock examples in the prompt. the article shows the exact ladder we use for fintech vs. creator brands.' },
      { heading: 'copy swaps', bullets: ['replace filler words ("innovative", "redefine") with proof-based verbs', 'keep button copy in first person ("start my build") for higher clickthrough', 'mirror palette language in the copy (e.g., “charcoal + amber” instead of “dark + gold”)'] },
      { heading: 'jasmine workflow', body: 'drop your brand blurb into the context drawer, run the “voice-locked” preset, and only accept outputs where the CTA and proof lines match the ladder tone.' },
      { heading: 'microcopy examples', body: 'cta: "start my build" instead of "get started"; proof: "trusted by 180 teams" instead of "trusted worldwide"; navigation: keep nouns consistent ("pricing" not "plans"). the article includes the exact swaps for sass, fintech, and creator brands.' },
      { heading: 'guardrails', bullets: ['ban generic adjectives in the prompt', 'limit button verbs to 3 options', 'force a supporting subhead that mirrors the headline verb to keep tone tight'] },
    ],
  },
  {
    title: 'motion that sells, not distracts',
    summary: 'how we choreograph blur-reveal, staggered cards, and purposeful parallax so jasmine sites feel premium on both desktop and mobile.',
    author: 'jasmine studio',
    date: '2026-02-03',
    readTime: '4 min read',
    tags: ['motion', 'experience', 'mobile'],
    keywords: ['motion design ai', 'microinteractions', 'jasmine animations', 'responsive ai design'],
    slug: 'motion-that-sells-not-distracts',
    content: [
      { heading: 'motion scorecard', body: 'ships with 3 rules: 120–180ms micro motions, stagger in batches of 3, and mobile-first easing. the post includes the framer-motion snippets we use here.' },
      { heading: 'keep it purposeful', bullets: ['use blur-reveal for headlines only; cards get a subtle y-offset', 'disable parallax on mobile — rely on opacity + scale instead', 'cap simultaneous animations to 6 elements to avoid jank in previews'] },
      { heading: 'try it', body: 'toggle “premium motion” in jasmine, then export to see the exact variants that match our production stack.' },
      { heading: 'performance tips', bullets: ['prefer transform + opacity instead of box-shadow animations', 'set will-change on hero elements only during entrance', 'use reduced motion media queries — the post shows the snippet we ship'] },
      { heading: 'case study', body: 'a fintech hero went from 1.4s to 0.9s TTI after we removed parallax on mobile and simplified stagger. gifs + code are in the article so you can mirror the setup.' },
    ],
  },
  {
    title: 'research-to-pixels in 20 seconds',
    summary: 'our workflow for turning a single prompt into a full funnel: research cues, seo snippets, section order, and live preview with jasmine.',
    author: 'jasmine studio',
    date: '2026-01-27',
    readTime: '9 min read',
    tags: ['workflow', 'research', 'ai production'],
    keywords: ['ai web design workflow', 'jasmine prompt', 'ai site builder', 'design to deploy'],
    slug: 'research-to-pixels-in-20-seconds',
    content: [
      { heading: 'timeline', body: '20 seconds to outline, 40 to preview, 2 minutes to ship. this walkthrough uses a real founder request from feb 2026 so you can mirror the prompts.' },
      { heading: 'steps', bullets: ['drop research notes into the context panel first', 'run the “full funnel” prompt for section order + seo snippets', 'apply edits via chat for pricing/faq tweaks, then download the zip'] },
      { heading: 'proof of speed', body: 'we include the screen recording and the final lighthouse score to show the workflow is production-worthy, not just fast.' },
      { heading: 'handoff flow', bullets: ['attach research pdf/notes as context', 'generate, then edit with slash commands for pricing and faq', 'download the zip and hand it to eng with the included checklist'] },
      { heading: 'pitfalls avoided', body: 'the post covers three traps: overlong intros, missing social proof above the fold, and under-specified pricing tables. we show the prompts that fix each in under 30 seconds.' },
    ],
  },
];

const SEO_POINTS = [
  { title: 'structured data out of the box', desc: 'json-ld, og, and twitter cards land with every drop so your jasmine pages index cleanly.' },
  { title: 'semantic sections', desc: 'heroes, features, faqs, and testimonials use real html landmarks - crawlers and screen readers win together.' },
  { title: 'copy engineered for intent', desc: 'each post leans on search intent keywords without sounding robotic. jasmine keeps it human.' },
];

const TOPICS = ['ai design', 'seo', 'conversion', 'design systems', 'brand voice', 'motion', 'shipping fast'];

function BlogPage({ theme, onStartDesigning, onBackHome, onOpenPost, onBackToList, activeSlug }) {
  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white border border-zinc-200/70 card-3d' : 'bg-white/[0.02] border border-white/[0.06] card-3d';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const sectionCl = 'px-6 md:px-12 lg:px-24';
  const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
  const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
  const maxW = 'max-w-5xl mx-auto';

  const keywords = useMemo(() => Array.from(new Set(POSTS.flatMap((p) => p.keywords))), []);
  const selectedPost = useMemo(() => POSTS.find((p) => p.slug === activeSlug) || null, [activeSlug]);

  useEffect(() => {
    const prevTitle = document.title;
    const baseDescription = "jasmine blog - ai design, seo, and production-ready frontends. learn how the world's best designer ships sites that rank and convert.";
    const isArticle = Boolean(selectedPost);
    const description = isArticle ? selectedPost.summary : baseDescription;
    const title = isArticle ? `${selectedPost.title} - Jasmine Blog` : 'Jasmine Blog - ai design systems, seo, and launch-ready code';
    const keywordList = isArticle ? selectedPost.keywords : keywords;

    const applyMeta = (attr, name, content) => {
      const selector = attr === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector);
      const prev = tag?.getAttribute('content') || null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
      return () => {
        if (prev === null) tag?.remove();
        else tag?.setAttribute('content', prev);
      };
    };

    document.title = title;
    const cleanups = [
      applyMeta('name', 'description', description),
      applyMeta('name', 'keywords', keywordList.join(', ')),
      applyMeta('property', 'og:title', title),
      applyMeta('property', 'og:description', description),
      applyMeta('property', 'og:type', isArticle ? 'article' : 'website'),
    ];

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    const url = typeof window !== 'undefined' ? window.location.href : 'https://tryjasmine.vercel.app/blog';
    ld.textContent = JSON.stringify(isArticle ? {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: selectedPost.title,
      description,
      datePublished: selectedPost.date,
      author: { '@type': 'Person', name: selectedPost.author },
      keywords: keywordList,
      url,
    } : {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Jasmine Blog',
      description,
      inLanguage: 'en',
      url,
      publisher: { '@type': 'Organization', name: 'Jasmine' },
      blogPost: POSTS.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        author: { '@type': 'Person', name: post.author },
      })),
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn());
      ld.remove();
    };
  }, [keywords, selectedPost]);

  const featured = POSTS[0];
  const rest = POSTS.slice(1);
  const openPost = (post) => onOpenPost?.(post.slug);
  const onCardKeyDown = (e, post) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPost(post);
    }
  };
  const renderCta = () => (
    <section className={`${sectionCl} py-24 border-t ${borderCl}`}>
      <BlurPopUpInView className={`${maxW} text-center`}>
        <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-4 font-display text-3d">
          <BlurPopUpByWordInView text="ready to turn the posts into pixels?" />
        </h2>
        <p className="text-base text-text-secondary max-w-2xl mx-auto mb-10">
          <BlurPopUpByWordInView text="launch jasmine, pick a prompt, and generate a full site with the same craft we write about - seo meta, motion, premium typography, and clean code." wordDelay={0.025} />
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onStartDesigning} className="btn-premium px-8 py-3 text-sm flex items-center gap-2">
            <i className="ph ph-rocket-launch text-base"></i>
            start designing
          </button>
          <button onClick={onBackHome} className={`${cardCl} px-6 py-3 rounded-lg text-sm font-medium text-text-primary flex items-center gap-2`}>
            <i className="ph ph-arrow-left"></i>
            back to overview
          </button>
        </div>
      </BlurPopUpInView>
    </section>
  );

  if (selectedPost) {
    const related = POSTS.filter((p) => p.slug !== selectedPost.slug);
    return (
      <div className="flex-1 overflow-y-auto">
    <section className={`${sectionCl} pt-16 pb-10 border-b ${borderCl}`}>
          <div className={`${maxW} space-y-5`}>
            <button onClick={onBackToList} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
              <i className="ph ph-arrow-left"></i>
              back to blog
            </button>
            <p className={`${labelCl} font-display text-3d`}>jasmine blog</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-text-primary font-display text-3d">
              {selectedPost.title}
            </h1>
            <p className="text-base md:text-lg leading-[1.6] text-text-secondary max-w-4xl">
              {selectedPost.summary}
            </p>
            <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-calendar-blank"></i>
                {formatDate(selectedPost.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-timer"></i>
                {selectedPost.readTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-user"></i>
                {selectedPost.author}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedPost.tags.map((tag) => (
                <span key={`${selectedPost.slug}-${tag}`} className={`text-xs px-2.5 py-1 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={onStartDesigning} className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2">
                <i className="ph ph-magic-wand"></i>
                build with jasmine
              </button>
              <button onClick={onBackHome} className="px-5 py-2.5 rounded-lg text-sm font-medium text-text-primary border border-transparent hover:border-[var(--color-border-default)]">
                <i className="ph ph-arrow-left"></i>
                back to overview
              </button>
            </div>
          </div>
        </section>

        <section className={`${sectionCl} py-12`}>
          <div className={`${maxW} space-y-10`}>
            {selectedPost.content?.map((section, i) => (
              <div key={`${selectedPost.slug}-${i}`} className="space-y-3">
                {section.heading ? <h3 className="text-lg md:text-xl font-semibold text-text-primary">{section.heading}</h3> : null}
                {section.body ? <p className="text-sm md:text-base leading-relaxed text-text-secondary">{section.body}</p> : null}
                {section.bullets ? (
                  <ul className="list-disc list-inside space-y-2 text-sm md:text-base text-text-secondary">
                    {section.bullets.map((b, j) => (
                      <li key={`${selectedPost.slug}-${i}-${j}`}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className={`${sectionCl} pb-16 border-t ${borderCl}`}>
          <div className={`${maxW} space-y-6`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className={headingCl}>more from jasmine</h3>
              <button onClick={onBackToList} className="text-sm text-text-muted hover:text-text-primary flex items-center gap-2">
                <i className="ph ph-newspaper"></i>
                back to all posts
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map((post, idx) => (
                <article
                  key={post.slug}
                  className={`${cardCl} rounded-lg p-6 flex flex-col justify-between cursor-pointer transition-transform hover:-translate-y-0.5`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPost(post)}
                  onKeyDown={(e) => onCardKeyDown(e, post)}
                >
                  <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                    <span className="inline-flex items-center gap-1">
                      <i className="ph ph-calendar-blank"></i>
                      {formatDate(post.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <i className="ph ph-timer"></i>
                      {post.readTime}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-text-primary leading-[1.2] mb-2">{post.title}</h4>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">{post.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <span key={`${tag}-${idx}`} className={`text-[11px] px-2.5 py-1 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                        {tag}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-text-primary">
                      <i className="ph ph-arrow-up-right"></i>
                      Read post
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {renderCta()}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <section className={`relative min-h-[60vh] flex items-center ${sectionCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/hero-bg.png')` }} />
        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-b from-white via-white/80 to-white' : 'bg-gradient-to-b from-black/40 via-surface/70 to-surface'}`} />
        <HeroGlowLines />
        <div className={`${maxW} relative w-full`}>
          <div className="flex flex-col gap-6 max-w-3xl">
            <p className={`${labelCl} font-display text-3d`}>
              <BlurPopUpByWord text="jasmine blog" wordDelay={0.02} />
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-text-primary font-display text-3d">
              <BlurPopUpByWord text="ai design that ships - notes from jasmine." wordDelay={0.05} />
            </h1>
            <p className={`text-base md:text-lg leading-[1.6] ${isLight ? 'text-text-secondary' : 'text-text-secondary [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'}`}>
              <BlurPopUpByWord text="conversion frameworks, seo checklists, and production-ready ui patterns. every post is written from how jasmine actually designs and ships." wordDelay={0.025} />
            </p>
            <div className="flex flex-wrap gap-3">
              <BlurPopUpInView>
                <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 text-sm px-8 py-3">
                  <i className="ph ph-rocket-launch text-base"></i>
                  design with jasmine
                </button>
              </BlurPopUpInView>
              <BlurPopUpInView>
                <button onClick={onBackHome} className={`${cardCl} px-5 py-3 rounded-lg text-sm font-medium text-text-primary flex items-center gap-2`}>
                  <i className="ph ph-arrow-left"></i>
                  back to overview
                </button>
              </BlurPopUpInView>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {TOPICS.map((t) => (
                <span key={t} className={`text-xs px-3 py-1.5 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionCl} py-20 border-t ${borderCl}`}>
        <motion.div
          className={`${maxW} grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.div variants={heroItem} className={`${cardCl} p-8 rounded-lg`}>
            <p className={labelCl}><BlurPopUpByWordInView text="featured" /></p>
            <h2 className="text-2xl font-semibold text-text-primary leading-[1.2] mb-3">
              <BlurPopUpByWordInView text={featured.title} wordDelay={0.02} />
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              <BlurPopUpByWordInView text={featured.summary} wordDelay={0.02} />
            </p>
            <div className="flex items-center gap-3 text-xs text-text-muted mb-6">
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-calendar-blank"></i>
                {formatDate(featured.date)}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-timer"></i>
                {featured.readTime}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button onClick={() => openPost(featured)} className="btn-premium px-5 py-2.5 text-sm flex items-center gap-2">
                <i className="ph ph-newspaper"></i>
                read the post
              </button>
              <button onClick={onStartDesigning} className={`${cardCl} px-4 py-2 rounded-lg text-sm font-medium text-text-primary flex items-center gap-2`}>
                <i className="ph ph-magic-wand"></i>
                build this flow
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {featured.tags.map((tag) => (
                <span key={tag} className={`text-xs px-3 py-1.5 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div variants={heroItem} className={`${cardCl} p-7 rounded-lg`}>
            <p className={labelCl}><BlurPopUpByWordInView text="why jasmine writes" /></p>
            <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
              <p><BlurPopUpByWordInView text="every essay comes from builds we ship inside jasmine. no recycled ai advice - just the systems we use to keep output premium and seo strong." wordDelay={0.02} /></p>
              <p><BlurPopUpByWordInView text="take the prompts, section orders, and microcopy straight into the canvas. jasmine keeps the code clean: semantic html, og tags, and tailwind tokens ready to export." wordDelay={0.025} /></p>
              <p className="text-text-primary font-medium"><BlurPopUpByWordInView text="read, then launch with jasmine." wordDelay={0.03} /></p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className={`${sectionCl} py-20 border-t ${borderCl}`}>
        <motion.div
          className={`${maxW} space-y-12`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className={labelCl}><BlurPopUpByWordInView text="latest drops" /></p>
              <h2 className={headingCl}><BlurPopUpByWordInView text="ai design, seo, shipping fast." /></h2>
            </div>
            <button onClick={onStartDesigning} className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2">
              <i className="ph ph-magic-wand"></i>
              start a build
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((post, idx) => (
              <motion.article
                key={post.title}
                variants={heroItem}
                className={`${cardCl} rounded-lg p-6 flex flex-col justify-between cursor-pointer transition-transform hover:-translate-y-0.5`}
                role="button"
                tabIndex={0}
                onClick={() => openPost(post)}
                onKeyDown={(e) => onCardKeyDown(e, post)}
              >
                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                  <span className="inline-flex items-center gap-1">
                    <i className="ph ph-calendar-blank"></i>
                    {formatDate(post.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="ph ph-timer"></i>
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary leading-[1.2] mb-2">
                  <BlurPopUpByWordInView text={post.title} wordDelay={0.02} />
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed flex-1">
                  <BlurPopUpByWordInView text={post.summary} wordDelay={0.02} />
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map((tag) => (
                    <span key={`${tag}-${idx}`} className={`text-[11px] px-2.5 py-1 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                      {tag}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openPost(post); }}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-text-primary hover:underline"
                  >
                    <i className="ph ph-arrow-up-right"></i>
                    Read post
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <section className={`${sectionCl} py-20 border-t ${borderCl}`}>
        <motion.div
          className={`${maxW} grid lg:grid-cols-2 gap-10 items-start`}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          variants={heroContainer}
        >
          <motion.div variants={heroItem} className={`${cardCl} p-7 rounded-lg`}>
            <p className={labelCl}><BlurPopUpByWordInView text="seo signals baked in" /></p>
            <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">
              <BlurPopUpByWordInView text="written like strategists, built like engineers." wordDelay={0.02} />
            </h2>
            <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
              {SEO_POINTS.map((p) => (
                <div key={p.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-jasmine-400/10 text-jasmine-400">
                    <i className="ph ph-check"></i>
                  </div>
                  <div>
                    <p className="text-text-primary font-medium mb-1">{p.title}</p>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {keywords.slice(0, 10).map((kw) => (
                <span key={kw} className={`text-[11px] px-3 py-1.5 rounded-full border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'} text-text-muted`}>
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div variants={heroItem} className={`${cardCl} p-7 rounded-lg`}>
            <p className={labelCl}><BlurPopUpByWordInView text="playbooks ready to use" /></p>
            <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
              <p><BlurPopUpByWordInView text="copy/paste prompts tuned for jasmine. hero-first structure, bento grids, faqs, and pricing sections with conversion math baked in." wordDelay={0.02} /></p>
              <p><BlurPopUpByWordInView text="every article links to the exact section order and palette we use, so you can launch the same quality in minutes." wordDelay={0.025} /></p>
              <p><BlurPopUpByWordInView text={'hit "design with jasmine" and the blog guidance becomes real code - vite, react, tailwind, semantic html, and seo metadata.'} wordDelay={0.03} /></p>
            </div>
            <button onClick={onStartDesigning} className="btn-premium mt-6 w-full justify-center flex items-center gap-2 text-sm py-2.5">
              <i className="ph ph-lightning"></i>
              open jasmine
            </button>
          </motion.div>
        </motion.div>
      </section>

      {renderCta()}
    </div>
  );
}

export default BlogPage;
