import { useState, useRef, useEffect } from 'react';
import { generateWithGroq, generateWithGemini, editWithGroq, editWithGemini, extractNextProject } from './api';
import LandingPage from './LandingPage';
import FileExplorer from './FileExplorer';

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rightTab, setRightTab] = useState('files');
  const [copied, setCopied] = useState(false);
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
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jasmine_history') || '[]'); } catch { return []; }
  });

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getKey = () =>
    provider === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!prompt.trim()) {
      setError('Enter a prompt to generate');
      textareaRef.current?.focus();
      return;
    }
    const key = getKey();
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
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'I\'ve generated your Next.js project. You can ask me to edit it — try "Make the header darker" or "Add a pricing section".' }]);

      setHistory((prev) => [{ prompt: prompt.slice(0, 100), timestamp: Date.now(), html: result, project: project || null, provider }, ...prev]);
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || isEditing) return;

    const key = getKey();
    if (!key) {
      setError('API key required');
      return;
    }

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsEditing(true);
    setError('');
    setStreamingRaw('');

    const currentCode = generatedHTML || streamingRaw;
    if (!currentCode) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'No project to edit yet. Generate first.' }]);
      setIsEditing(false);
      return;
    }

    try {
      const editFn = provider === 'groq' ? editWithGroq : editWithGemini;
      const result = await editFn(key, currentCode, msg, (chunk) => setStreamingRaw(chunk));

      const project = extractNextProject(result);
      if (project?.files) {
        setGeneratedProject((prev) => ({
          files: { ...(prev?.files || {}), ...project.files },
        }));
      }
      setGeneratedHTML(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Applied your edit. Check the Files tab.' }]);
      setRightTab('files');
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsEditing(false);
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

  const loadFromHistory = (item) => {
    setGeneratedHTML(item.html);
    setGeneratedProject(item.project || null);
    setPrompt(item.prompt);
    setChatMessages([{ role: 'user', content: item.prompt }, { role: 'assistant', content: 'Project loaded from history.' }]);
    setShowLanding(false);
  };

  const deployToSandbox = async () => {
    const project = generatedProject || extractNextProject(streamingRaw || generatedHTML);
    if (!project?.files) {
      setError('No Next.js project to deploy.');
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
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || 'Deploy failed');
      }
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
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${base}`}>
      <header className={`flex-none border-b ${borderCl} bg-surface/95 backdrop-blur-xl z-50`}>
        <div className="flex items-center justify-between px-6 md:px-12 h-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLight ? 'bg-zinc-900' : 'bg-white'}`}>
              <i className={`ph-bold ph-sparkle text-sm ${isLight ? 'text-white' : 'text-zinc-900'}`}></i>
            </div>
            <span className="text-lg font-semibold tracking-[-0.02em] text-text-primary">Jasmine</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors ${isLight ? 'hover:bg-zinc-100' : 'hover:bg-white/[0.04]'}`}
            >
              <i className={`ph text-lg ${theme === 'dark' ? 'ph-sun' : 'ph-moon'}`}></i>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {showLanding && !hasOutput ? (
          <LandingPage
            onStartDesigning={() => { setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            onSelectPrompt={(p) => { setPrompt(p); setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            theme={theme}
          />
        ) : !hasOutput ? (
          /* Centralized hero — monochrome, single prompt */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl">
              <button
                onClick={() => setShowLanding(true)}
                className="text-sm text-text-muted hover:text-text-secondary mb-8"
              >
                ← Back
              </button>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-text-primary mb-2">
                  What will you design today?
                </h1>
                <p className="text-text-secondary text-sm">
                  Describe it. One prompt. Full Next.js project.
                </p>
              </div>
              <div className={`prompt-container rounded-xl overflow-hidden ${isLight ? 'border border-zinc-200' : 'border border-white/[0.08]'}`}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="A landing page for a law firm — trustworthy, professional, navy and gold..."
                  rows={4}
                  className={`w-full px-5 py-4 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none resize-none leading-[1.5] tracking-[-0.01em] ${isLight ? 'placeholder:text-zinc-400' : ''}`}
                />
                <div className={`flex items-center justify-between px-5 py-3 border-t ${borderCl}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center rounded-lg p-0.5 ${isLight ? 'bg-zinc-100 border border-zinc-200' : 'bg-white/[0.04] border border-white/[0.06]'}`}>
                      <button
                        onClick={() => setProvider('groq')}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                          provider === 'groq' ? (isLight ? 'bg-white text-zinc-900 shadow-sm' : 'bg-white/10 text-white') : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><i className={`ph ${provider === 'groq' ? 'ph-fill' : 'ph'} ph-lightning text-xs`}></i> Kimi K2</span>
                      </button>
                      <button
                        onClick={() => setProvider('gemini')}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                          provider === 'gemini' ? (isLight ? 'bg-white text-zinc-900 shadow-sm' : 'bg-white/10 text-white') : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><i className={`ph ${provider === 'gemini' ? 'ph-fill' : 'ph'} ph-palette text-xs`}></i> Gemini</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-text-muted">
                      {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generate}
                    disabled={isGenerating}
                    className="btn-premium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <><i className="ph ph-circle-notch text-lg animate-spin-slow"></i><span>Generating</span></>
                    ) : (
                      <><i className="ph ph-magic-wand text-lg"></i><span>Generate</span></>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Generation started: Chat left, Code/Preview tabs right */
          <>
            <div className={`w-[360px] flex-shrink-0 flex flex-col border-r ${borderCl}`}>
              <div className={`flex-none px-4 py-3 border-b ${borderCl}`}>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Chat</p>
                <p className="text-sm text-text-secondary mt-0.5">Ask to edit your design</p>
                {history.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">History</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {history.slice(0, 5).map((item, i) => (
                        <button
                          key={i}
                          onClick={() => loadFromHistory(item)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary truncate ${isLight ? 'hover:bg-zinc-100' : 'hover:bg-white/[0.04]'}`}
                        >
                          {item.prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block max-w-[90%] px-3 py-2 rounded-xl ${
                        m.role === 'user'
                          ? (isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-white/10 text-text-primary')
                          : (isLight ? 'bg-zinc-100 border border-zinc-200 text-zinc-600' : 'bg-white/[0.04] border border-white/[0.06] text-text-secondary')
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-text-muted text-sm">
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
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${borderCl} text-text-primary placeholder:text-text-muted focus:outline-none ${
                      isLight ? 'bg-zinc-50 focus:border-zinc-400' : 'bg-white/[0.04] focus:border-white/20'
                    }`}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isEditing}
                    className="btn-premium px-4 py-2.5 text-sm disabled:opacity-40"
                  >
                    <i className="ph ph-paper-plane-tilt"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className={`flex-none flex items-center justify-between px-5 h-14 border-b ${borderCl} bg-surface-raised/80`}>
                <div className="flex gap-1">
                  <button
                    onClick={() => setRightTab('files')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                      rightTab === 'files' ? 'bg-surface-overlay text-text-primary' : `text-text-muted hover:text-text-secondary ${ghostCl}`
                    }`}
                  >
                    <i className="ph ph-folder"></i>
                    Files
                  </button>
                  <button
                    onClick={() => setRightTab('preview')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                      rightTab === 'preview' ? 'bg-surface-overlay text-text-primary' : `text-text-muted hover:text-text-secondary ${ghostCl}`
                    }`}
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
                      className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`}
                      title="Deploy to E2B"
                    >
                      {deploying ? <i className="ph ph-circle-notch text-lg animate-spin-slow"></i> : <i className="ph ph-rocket-launch text-lg"></i>}
                    </button>
                  )}
                  <button onClick={copyCode} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Copy">
                    {copied ? <i className="ph ph-check text-lg text-text-primary"></i> : <i className="ph ph-copy text-lg"></i>}
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
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <i className={`ph ph-circle-notch text-2xl animate-spin-slow ${isLight ? 'text-zinc-600' : 'text-white/80'}`}></i>
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
                        <i className={`ph ph-rocket-launch text-4xl mb-4 block ${isLight ? 'text-zinc-600' : 'text-white/80'}`}></i>
                        <p className="text-text-primary font-semibold mb-2">Next.js project generated</p>
                        <p className="text-sm text-text-muted mb-4">
                          Deploy to E2B to preview. Run <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs">npm run server</code> first, then click the rocket icon above.
                        </p>
                        <p className="text-xs text-text-muted mb-4">{Object.keys(generatedProject.files).length} files</p>
                        {deployUrl ? (
                          <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="btn-premium inline-flex items-center gap-2">
                            Open preview <i className="ph ph-arrow-square-out"></i>
                          </a>
                        ) : (
                          <button onClick={deployToSandbox} disabled={deploying} className="btn-premium inline-flex items-center gap-2 disabled:opacity-50">
                            {deploying ? <i className="ph ph-circle-notch animate-spin-slow"></i> : <i className="ph ph-rocket-launch"></i>}
                            {deploying ? 'Deploying...' : 'Deploy to preview'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-text-muted">
                        <p className="mb-2">{(isGenerating || isEditing) ? 'Generating your project...' : 'No project yet.'}</p>
                        <p className="text-sm">Switch to Files to see code streaming in.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
