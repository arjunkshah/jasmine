import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import BlurPopUpByWordInView from './components/BlurPopUpByWordInView';
import BlurPopUpInView from './components/BlurPopUpInView';
import HeroGlowLines from './components/HeroGlowLines';
import { heroContainer, heroItem } from './lib/animations';

const POSTS = [
  {
    title: 'ai design playbook: conversion-first hero flows',
    summary: 'how jasmine frames the first 8 seconds: contrasty hero, crisp social proof, and a single action that makes ai output feel like a senior art director touched it.',
    author: 'jasmine studio',
    date: '2025-02-10',
    readTime: '7 min read',
    tags: ['conversion', 'landing page', 'hero'],
    keywords: ['ai design playbook', 'conversion hero', 'jasmine ai designer', 'landing page seo'],
  },
  {
    title: 'seo-perfect layouts without the slop',
    summary: 'semantic sections, og tags, lighthouse-friendly spacing, and copy that reads like a strategist wrote it. jasmine ships pages search engines and humans love.',
    author: 'jasmine studio',
    date: '2025-02-07',
    readTime: '6 min read',
    tags: ['seo', 'semantic html', 'content'],
    keywords: ['seo ai website', 'semantic html', 'structured data', 'ai blog jasmine'],
  },
  {
    title: 'design systems: jasmine + tailwind = production',
    summary: 'why we pair jasmine with tailwind tokens, motion primitives, and phosphor icons so the code you export is ready for real teams.',
    author: 'jasmine studio',
    date: '2025-02-02',
    readTime: '8 min read',
    tags: ['design systems', 'tailwind', 'code quality'],
    keywords: ['tailwind ai designer', 'design system ai', 'jasmine components', 'production-ready ui'],
  },
  {
    title: 'brand voice with ai that actually feels on-voice',
    summary: 'tone ladders, microcopy swaps, and palette pivots that keep ai from sounding generic. jasmine keeps the personality intact.',
    author: 'jasmine studio',
    date: '2025-01-28',
    readTime: '5 min read',
    tags: ['brand', 'microcopy', 'voice'],
    keywords: ['brand voice ai', 'microcopy ai', 'jasmine brand design', 'ai copywriting design'],
  },
  {
    title: 'motion that sells, not distracts',
    summary: 'how we choreograph blur-reveal, staggered cards, and purposeful parallax so jasmine sites feel premium on both desktop and mobile.',
    author: 'jasmine studio',
    date: '2025-01-21',
    readTime: '4 min read',
    tags: ['motion', 'experience', 'mobile'],
    keywords: ['motion design ai', 'microinteractions', 'jasmine animations', 'responsive ai design'],
  },
  {
    title: 'research-to-pixels in 20 seconds',
    summary: 'our workflow for turning a single prompt into a full funnel: research cues, seo snippets, section order, and live preview with jasmine.',
    author: 'jasmine studio',
    date: '2025-01-15',
    readTime: '9 min read',
    tags: ['workflow', 'research', 'ai production'],
    keywords: ['ai web design workflow', 'jasmine prompt', 'ai site builder', 'design to deploy'],
  },
];

const SEO_POINTS = [
  { title: 'structured data out of the box', desc: 'json-ld, og, and twitter cards land with every drop so your jasmine pages index cleanly.' },
  { title: 'semantic sections', desc: 'heroes, features, faqs, and testimonials use real html landmarks - crawlers and screen readers win together.' },
  { title: 'copy engineered for intent', desc: 'each post leans on search intent keywords without sounding robotic. jasmine keeps it human.' },
];

const TOPICS = ['ai design', 'seo', 'conversion', 'design systems', 'brand voice', 'motion', 'shipping fast'];

function BlogPage({ theme, onStartDesigning, onBackHome }) {
  const isLight = theme === 'light';
  const cardCl = isLight ? 'bg-white border border-zinc-200/70 card-3d' : 'bg-white/[0.02] border border-white/[0.06] card-3d';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const sectionCl = 'px-6 md:px-12 lg:px-24';
  const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
  const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
  const maxW = 'max-w-5xl mx-auto';

  const keywords = useMemo(() => Array.from(new Set(POSTS.flatMap((p) => p.keywords))), []);

  useEffect(() => {
    const prevTitle = document.title;
    const description = "jasmine blog - ai design, seo, and production-ready frontends. learn how the world's best designer ships sites that rank and convert.";

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

    document.title = 'Jasmine Blog - ai design systems, seo, and launch-ready code';
    const cleanups = [
      applyMeta('name', 'description', description),
      applyMeta('name', 'keywords', keywords.join(', ')),
      applyMeta('property', 'og:title', 'Jasmine Blog - ai design systems, seo, and launch-ready code'),
      applyMeta('property', 'og:description', description),
      applyMeta('property', 'og:type', 'article'),
    ];

    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Jasmine Blog',
      description,
      inLanguage: 'en',
      url: typeof window !== 'undefined' ? window.location.href : 'https://tryjasmine.vercel.app/blog',
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
  }, [keywords]);

  const featured = POSTS[0];
  const rest = POSTS.slice(1);

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
                {featured.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="ph ph-timer"></i>
                {featured.readTime}
              </span>
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
                className={`${cardCl} rounded-lg p-6 flex flex-col justify-between`}
              >
                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                  <span className="inline-flex items-center gap-1">
                    <i className="ph ph-calendar-blank"></i>
                    {post.date}
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
    </div>
  );
}

export default BlogPage;
