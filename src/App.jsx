import { useState, useRef, useEffect } from 'react';
import { generateWithGroq, generateWithGemini, editWithGroq, editWithGemini, extractNextProject } from './api';
import LandingPage from './LandingPage';
import FileExplorer from './FileExplorer';

const EXAMPLE_CARDS = [
  { label: 'Law firm', desc: 'Full site: home, about, practice areas, team, contact. Every page, every section.', prompt: 'Complete law firm website — home, about, practice areas grid, team bios, contact page. Trustworthy, Lora serif, navy and gold. Every page, every section, every animation.' },
  { label: 'SaaS', desc: 'Full product site: landing, features, pricing, docs, dashboard. All pages.', prompt: 'Complete SaaS site for a dev tool — landing, features, pricing, docs, dashboard. Dark mode, Vercel-inspired, Space Grotesk. Every page, every section, every animation.' },
  { label: 'Restaurant', desc: 'Full site: home, menu, reservations, about, contact. All sections.', prompt: 'Complete restaurant website — home, full menu, reservations, about, contact. Warm, appetizing, DM Sans. Every page, every section, every animation.' },
  { label: 'Gaming studio', desc: 'Full portfolio: home, games, team, careers, contact. All pages.', prompt: 'Complete gaming studio site — home, games showcase, team, careers, contact. Bold gradients, Overused Grotesk. Every page, every section, every animation.' },
  { label: 'Meditation app', desc: 'Full app site: landing, features, testimonials, pricing, download.', prompt: 'Complete meditation app site — landing, features, testimonial carousel, pricing, download CTA. Soft, calming, Lora serif. Every page, every section, every animation.' },
  { label: 'Creative agency', desc: 'Full portfolio: home, work, about, services, contact. All pages.', prompt: 'Complete creative agency portfolio — home, case studies, about, services, contact. Dark editorial, asymmetric grid. Every page, every section, every animation.' },
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rightTab, setRightTab] = useState('files');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [provider, setProvider] = useState(() => localStorage.getItem('jasmine_provider') || 'groq');
  const [error, setError] = useState('');
  const [streamingRaw, setStreamingRaw] = useState('');
  const [showLanding, setShowLanding] = useState(() => {
    const v = localStorage.getItem('jasmine_show_landing');
    return v === null ? true : v === 'true';
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('jasmine_theme') || 'light');
  const [generatedProject, setGeneratedProject] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jasmine_history') || '[]'); } catch { return []; }
  });

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('jasmine_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('jasmine_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('jasmine_history', JSON.stringify(history.slice(0, 20)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('jasmine_show_landing', String(showLanding));
  }, [showLanding]);

  const generate = async () => {
    if (!prompt.trim()) {
      setError('Enter a prompt to generate');
      textareaRef.current?.focus();
      return;
    }

    const key = provider === 'groq'
      ? import.meta.env.VITE_GROQ_API_KEY
      : import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      setError(`Add VITE_${provider === 'groq' ? 'GROQ' : 'GEMINI'}_API_KEY to your .env file`);
      return;
    }

    setIsGenerating(true);
    setError('');
    setStreamingRaw('');
    setGeneratedHTML('');
    setGeneratedProject(null);
    setDeployUrl(null);
    setChatMessages([{ role: 'user', content: prompt }]);
    setShowLanding(false);

    try {
      const generateFn = provider === 'groq' ? generateWithGroq : generateWithGemini;
      const result = await generateFn(key, prompt, (chunk) => setStreamingRaw(chunk));

      const project = extractNextProject(result);
      if (project) setGeneratedProject(project);
      setGeneratedHTML(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'I\'ve generated your Next.js project. Ask me to edit it — e.g. "Make the header darker" or "Add a pricing section".' }]);

      setHistory(prev => [{
        prompt: prompt.slice(0, 100),
        timestamp: Date.now(),
        html: result,
        project: project || null,
        provider,
      }, ...prev]);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generate();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHTML = () => {
    const content = generatedProject?.files
      ? JSON.stringify({ files: generatedProject.files }, null, 2)
      : generatedHTML;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jasmine-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || isEditing) return;
    const key = provider === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) { setError('API key required'); return; }

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsEditing(true);
    setError('');
    setStreamingRaw('');

    const currentCode = generatedHTML || streamingRaw;
    if (!currentCode) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Generate first.' }]);
      setIsEditing(false);
      return;
    }

    try {
      const editFn = provider === 'groq' ? editWithGroq : editWithGemini;
      const result = await editFn(key, currentCode, msg, (chunk) => setStreamingRaw(chunk));
      const project = extractNextProject(result);
      if (project?.files) setGeneratedProject((prev) => ({ files: { ...(prev?.files || {}), ...project.files } }));
      setGeneratedHTML(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Done. Check the Files tab.' }]);
      setRightTab('files');
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsEditing(false);
    }
  };

  const loadFromHistory = (item) => {
    setGeneratedHTML(item.html);
    setGeneratedProject(item.project || null);
    setPrompt(item.prompt);
    setChatMessages([{ role: 'user', content: item.prompt }, { role: 'assistant', content: 'Loaded.' }]);
    setShowLanding(false);
  };

  const deployToSandbox = async () => {
    const project = generatedProject || extractNextProject(streamingRaw || generatedHTML);
    if (!project?.files) {
      setError('No Next.js project to deploy. Generate in Next.js mode first.');
      return;
    }
    setDeploying(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(text || 'Deploy failed'); }
      if (!res.ok) throw new Error(data.error || text || 'Deploy failed');
      setDeployUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  const hasOutput = generatedHTML || streamingRaw;
  const isLight = theme === 'light';
  const base = 'bg-surface text-text-primary';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const cardCl = isLight ? 'bg-white border-zinc-200 shadow-sm' : 'card-depth';
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'input-premium';

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${base}`}>
      {/* Header */}
      <header className={`flex-none border-b ${borderCl} bg-surface/90 backdrop-blur-2xl z-50`}>
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-jasmine-400 to-jasmine-500 flex items-center justify-center shadow-[0_4px_14px_rgba(250,204,21,0.25)]">
              <i className="ph-bold ph-sparkle text-base text-[#0a0a0b]"></i>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-[-0.03em] leading-[1.1] text-text-primary">Jasmine</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-jasmine-400/15 text-jasmine-400 uppercase tracking-[0.08em]">AI</span>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-text-muted hover:text-text-primary transition-colors"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            <i className={`ph text-lg ${theme === 'dark' ? 'ph-sun' : 'ph-moon'}`}></i>
          </button>
        </div>

      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {showLanding && !hasOutput ? (
          <LandingPage
            onStartDesigning={() => { setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            onSelectPrompt={(p) => { setPrompt(p); setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            theme={theme}
          />
        ) : (
          <>
            <div className={`flex border-r ${borderCl} transition-all duration-300 ${hasOutput ? 'w-[360px] flex-shrink-0 flex-col' : 'flex-1 min-w-0 flex-col sm:flex-row'}`}>
              <div className={`flex-1 flex flex-col min-w-0 ${hasOutput ? 'flex overflow-hidden' : 'p-6 sm:p-8 sm:max-w-[520px]'}`}>
                {hasOutput ? (
                  <>
                    <div className={`flex-none px-4 py-3 border-b ${borderCl}`}>
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Chat</p>
                      <p className="text-sm text-text-secondary mt-0.5">Ask to edit your design</p>
                      {history.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">History</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {history.slice(0, 5).map((item, i) => (
                              <button key={i} onClick={() => loadFromHistory(item)} className={`w-full text-left px-2 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary truncate border ${ghostCl}`}>
                                {item.prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block max-w-[90%] px-3 py-2 rounded-xl ${m.role === 'user' ? (isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-text-primary') : (isLight ? 'bg-zinc-100 border border-zinc-200 text-zinc-600' : 'bg-white/[0.04] border border-white/[0.06] text-text-secondary')}`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {isEditing && (
                        <div className="text-left">
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${isLight ? 'bg-zinc-100' : 'bg-white/[0.04]'} text-text-muted text-sm`}>
                            <i className="ph ph-circle-notch animate-spin-slow"></i>
                            <span>Applying edit...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className={`flex-none p-4 border-t ${borderCl}`}>
                      <div className="flex gap-2">
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                          placeholder="Make the header darker..."
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${borderCl} text-text-primary placeholder:text-text-muted focus:outline-none ${isLight ? 'bg-zinc-50' : 'bg-white/[0.04]'}`}
                        />
                        <button onClick={sendChatMessage} disabled={!chatInput.trim() || isEditing} className="btn-premium px-4 py-2.5 text-sm text-[#0a0a0b] disabled:opacity-40">
                          <i className="ph ph-paper-plane-tilt"></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                {!hasOutput && (
                  <div className="mb-4">
                    <h1 className="text-2xl sm:text-[2rem] font-extrabold tracking-[-0.04em] leading-[1.1] text-text-primary mb-2">
                      What do you want to build?
                    </h1>
                    <p className="text-base text-text-secondary leading-[1.5] mb-3">
                      Describe it. Jasmine will craft it.
                    </p>
                    <button
                      onClick={() => setShowLanding(true)}
                      className="text-sm text-text-muted hover:text-text-secondary"
                    >
                      ← Back to overview
                    </button>
                  </div>
                )}

                <div className={hasOutput ? '' : 'flex-1 flex flex-col min-w-0 min-h-0'}>
                  <div className={`prompt-container overflow-hidden ${!hasOutput ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="A landing page for..."
                      rows={hasOutput ? 4 : 5}
                      className={`w-full px-4 py-3 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none resize-none leading-[1.5] tracking-[-0.01em] ${!hasOutput ? 'flex-1 min-h-0' : ''}`}
                    />
                    <div className={`flex items-center justify-between px-4 py-2.5 border-t ${borderCl}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center rounded-lg p-0.5 border ${borderCl} ${isLight ? 'bg-zinc-100/80' : 'bg-white/[0.04]'}`}>
                          <button
                            onClick={() => setProvider('groq')}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              provider === 'groq' ? (isLight ? 'bg-white text-text-primary shadow-sm border border-zinc-200' : 'bg-white/[0.08] text-text-primary') : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <i className={`ph ${provider === 'groq' ? 'ph-fill' : 'ph'} ph-lightning text-sm`}></i>
                              Kimi K2
                            </span>
                          </button>
                          <button
                            onClick={() => setProvider('gemini')}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              provider === 'gemini' ? (isLight ? 'bg-white text-text-primary shadow-sm border border-zinc-200' : 'bg-white/[0.08] text-text-primary') : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <i className={`ph ${provider === 'gemini' ? 'ph-fill' : 'ph'} ph-palette text-sm`}></i>
                              Gemini
                            </span>
                          </button>
                        </div>
                        <span className="text-[11px] text-text-muted tracking-[0.02em] uppercase font-medium">
                          {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={generate}
                        disabled={isGenerating}
                        className="btn-premium flex items-center gap-2 text-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        {isGenerating ? (
                          <>
                            <i className="ph ph-circle-notch text-lg animate-spin-slow"></i>
                            <span>Generating</span>
                          </>
                        ) : (
                          <>
                            <i className="ph ph-magic-wand text-lg"></i>
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {!hasOutput && history.length > 0 && (
                  <div className="mt-6 flex-1 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">History</p>
                    <div className="space-y-1">
                      {history.map((item, i) => (
                        <button
                          key={i}
                          onClick={() => loadFromHistory(item)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg ${ghostCl} text-[13px] text-text-secondary hover:text-text-primary transition-colors truncate border`}
                        >
                          <span className="text-text-muted mr-2">{item.provider === 'groq' ? '⚡' : '✦'}</span>
                          {item.prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>

              {!hasOutput && (
                <div className={`flex-1 min-w-0 sm:min-w-[340px] lg:min-w-[400px] w-full pt-4 sm:pt-0 sm:pl-6 lg:pl-8 sm:border-l ${borderCl} flex flex-col overflow-y-auto border-t sm:border-t-0 sm:py-6 sm:pb-8`}>
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-4 px-1">Quick picks</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
                    {EXAMPLE_CARDS.map((card, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(card.prompt)}
                        className={`${cardCl} text-left px-4 py-4 rounded-xl border transition-all hover:border-jasmine-400/30 hover:shadow-md hover:shadow-jasmine-400/5 flex flex-col gap-1.5 min-h-[100px]`}
                      >
                        <span className="text-jasmine-400 font-semibold text-sm uppercase tracking-wider">{card.label}</span>
                        <span className="text-sm text-text-secondary leading-[1.4] line-clamp-2">{card.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {deployUrl && (
                <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between gap-3">
                  <span>Deployed! Preview may take 1–2 min.</span>
                  <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                    Open <i className="ph ph-arrow-square-out text-base"></i>
                  </a>
                </div>
              )}
              {error && (
                <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {hasOutput && (
              <div className="flex-1 flex flex-col min-w-0">
                <div className={`flex-none flex items-center justify-between px-5 h-14 border-b ${borderCl} bg-surface-raised/80 backdrop-blur-xl`}>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setRightTab('files')}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${rightTab === 'files' ? 'bg-surface-overlay text-text-primary' : `text-text-muted hover:text-text-secondary ${ghostCl}`}`}
                    >
                      <i className="ph ph-folder"></i>
                      Files
                    </button>
                    <button
                      onClick={() => setRightTab('preview')}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${rightTab === 'preview' ? 'bg-surface-overlay text-text-primary' : `text-text-muted hover:text-text-secondary ${ghostCl}`}`}
                    >
                      <i className="ph ph-eye"></i>
                      Preview
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {generatedProject?.files && (
                      <button
                        onClick={deployToSandbox}
                        disabled={deploying}
                        className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary disabled:opacity-50`}
                        title="Deploy to E2B"
                      >
                        {deploying ? <i className="ph ph-circle-notch text-lg animate-spin-slow"></i> : <i className="ph ph-rocket-launch text-lg"></i>}
                      </button>
                    )}
                    <button onClick={copyCode} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Copy">
                      {copied ? <i className="ph ph-check text-lg text-emerald-400"></i> : <i className="ph ph-copy text-lg"></i>}
                    </button>
                    <button onClick={downloadHTML} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Download">
                      <i className="ph ph-download-simple text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 bg-[#0a0a0b]">
                  {isGenerating && !generatedHTML && rightTab === 'files' && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0b]">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-jasmine-400/10 flex items-center justify-center border border-jasmine-400/20">
                          <i className="ph ph-circle-notch text-2xl text-jasmine-400 animate-spin-slow"></i>
                        </div>
                        <p className="text-[15px] font-semibold text-text-primary">Crafting your project</p>
                        <p className="text-[13px] text-text-muted">Tokens streaming...</p>
                      </div>
                    </div>
                  )}

                  {rightTab === 'files' && (
                    <div className="absolute inset-0">
                      <FileExplorer
                        files={generatedProject?.files}
                        streamingRaw={streamingRaw || generatedHTML}
                        isStreaming={isGenerating || isEditing}
                      />
                    </div>
                  )}

                  {rightTab === 'preview' && (
                    <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto">
                      {generatedProject?.files ? (
                        <div className="text-center max-w-md">
                          <i className="ph ph-rocket-launch text-4xl text-jasmine-400 mb-4 block"></i>
                          <p className="text-text-primary font-semibold mb-2">Next.js project generated</p>
                          <p className="text-sm text-text-muted mb-4">
                            Deploy to E2B to preview. Run <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs">npm run server</code> first, then click the rocket icon.
                          </p>
                          <p className="text-xs text-text-muted mb-4">{Object.keys(generatedProject.files).length} files</p>
                          {deployUrl ? (
                            <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="btn-premium inline-flex items-center gap-2 text-[#0a0a0b]">
                              Open preview <i className="ph ph-arrow-square-out"></i>
                            </a>
                          ) : (
                            <button onClick={deployToSandbox} disabled={deploying} className="btn-premium inline-flex items-center gap-2 text-[#0a0a0b] disabled:opacity-50">
                              {deploying ? <i className="ph ph-circle-notch animate-spin-slow"></i> : <i className="ph ph-rocket-launch"></i>}
                              {deploying ? 'Deploying...' : 'Deploy to preview'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-text-muted">
                          <p className="mb-2">{(isGenerating || isEditing) ? 'Generating...' : 'No project yet.'}</p>
                          <p className="text-sm">Switch to Files to see code.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
