import { useState, useRef, useEffect } from 'react';
import { generateWithGroq, generateWithGemini, editWithGroq, editWithGemini, extractNextProject, parseProjectFromJson, projectToRaw } from './api';
import { downloadProjectAsZip } from './downloadZip';
import LandingPage from './LandingPage';
import FileExplorer from './FileExplorer';

function AppBody({
  theme,
  showLanding,
  setShowLanding,
  hasOutput,
  isGenerating,
  isEditing,
  rightTab,
  setRightTab,
  prompt,
  setPrompt,
  chatMessages,
  chatInput,
  setChatInput,
  provider,
  setProvider,
  error,
  history,
  loadFromHistory,
  deployUrl,
  sandboxStarting,
  generatedProject,
  streamingRaw,
  generatedHTML,
  showImportJson,
  setShowImportJson,
  importJsonInput,
  setImportJsonInput,
  importJsonError,
  setImportJsonError,
  textareaRef,
  chatEndRef,
  generate,
  handleKeyDown,
  sendChatMessage,
  loadFromJson,
  copyCode,
  downloadProject,
  onThemeToggle,
  themeForToggle,
  copied,
}) {
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'input-premium';

  return (
    <>
      <header className={`flex-none border-b ${borderCl} bg-surface z-50`}>
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border ${borderCl} flex items-center justify-center`}>
              <i className="ph ph-sparkle text-sm text-text-primary"></i>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">jasmine</span>
              <span className="text-[10px] text-text-muted tracking-wider">ai</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowImportJson(true); setImportJsonError(''); setImportJsonInput(''); }}
              className="p-2 text-text-muted hover:text-text-primary transition-colors"
              title="Import from JSON"
            >
              <i className="ph ph-file-json text-lg"></i>
            </button>
            {onThemeToggle ? (
              <button
                onClick={onThemeToggle}
                className="p-2 text-text-muted hover:text-text-primary transition-colors"
                title={themeForToggle === 'dark' ? 'Switch to light' : 'Switch to dark'}
              >
                <i className={`ph text-lg ${themeForToggle === 'dark' ? 'ph-sun' : 'ph-moon'}`}></i>
              </button>
            ) : (
              <div className="w-9 h-9" aria-hidden />
            )}
          </div>
        </div>
      </header>

      {showImportJson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowImportJson(false)}>
          <div className={`w-full max-w-2xl rounded-2xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-2xl p-6`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <i className="ph ph-file-json text-jasmine-400"></i>
                Import from JSON
              </h2>
              <button onClick={() => setShowImportJson(false)} className="p-2 text-text-muted hover:text-text-primary rounded-lg">
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-3">
              Paste JSON from a previous download. Expected format: <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs">{`{ "files": { "path": "content", ... } }`}</code>
            </p>
            <textarea
              value={importJsonInput}
              onChange={e => { setImportJsonInput(e.target.value); setImportJsonError(''); }}
              placeholder='{"files":{"app/page.tsx":"export default..."}}'
              rows={12}
              className={`w-full px-4 py-3 rounded-xl text-sm font-mono border ${borderCl} ${isLight ? 'bg-zinc-50' : 'bg-black/30'} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 resize-none`}
            />
            {importJsonError && (
              <p className="mt-2 text-sm text-red-400">{importJsonError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowImportJson(false)} className={`px-4 py-2 rounded-xl font-semibold text-sm ${ghostCl}`}>
                Cancel
              </button>
              <button onClick={loadFromJson} className="btn-premium px-4 py-2 rounded-md text-sm">
                <i className="ph ph-upload-simple mr-2"></i>
                Load project
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {showLanding && !hasOutput ? (
          <LandingPage
            onStartDesigning={() => { setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            onSelectPrompt={(p) => { setPrompt(p); setShowLanding(false); setTimeout(() => textareaRef.current?.focus(), 100); }}
            onImportJson={() => { setShowImportJson(true); setImportJsonError(''); setImportJsonInput(''); }}
            theme={theme}
          />
        ) : (
          <>
            <div className={`flex border-r ${borderCl} transition-all duration-300 ${hasOutput ? 'w-[360px] flex-shrink-0 flex-col' : 'flex-1 min-w-0 flex-col'}`}>
              <div className={`flex-1 flex flex-col min-w-0 ${hasOutput ? 'flex overflow-hidden' : 'flex items-center justify-center p-6 sm:p-8'}`}>
                {hasOutput ? (
                  <>
                    <div className={`flex-none px-4 py-3 border-b ${borderCl}`}>
                      <p className="text-xs text-text-muted tracking-wider">chat</p>
                      <p className="text-sm text-text-secondary mt-0.5">ask to edit your design</p>
                      {history.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-text-muted tracking-wider mb-1">history</p>
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
                        <button onClick={sendChatMessage} disabled={!chatInput.trim() || isEditing} className="btn-premium px-4 py-2.5 text-sm disabled:opacity-40">
                          <i className="ph ph-paper-plane-tilt"></i>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-2xl mx-auto">
                    <button
                      onClick={() => setShowLanding(true)}
                      className="text-sm text-text-muted hover:text-text-secondary mb-8"
                    >
                      ← back to overview
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] leading-[1.2] text-text-primary mb-4 text-center">
                      what will you design today?
                    </h1>
                    <p className="text-text-secondary text-center mb-4 text-base">
                      describe it. one prompt. full next.js project.
                    </p>
                    {(deployUrl || sandboxStarting) && (
                      <div className="mb-6 flex items-center justify-center gap-2">
                        {sandboxStarting ? (
                          <span className="text-sm text-text-muted flex items-center gap-2">
                            <i className="ph ph-circle-notch animate-spin-slow"></i>
                            Starting preview sandbox...
                          </span>
                        ) : deployUrl ? (
                          <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-jasmine-400 hover:text-jasmine-300 flex items-center gap-1.5 font-medium">
                            <i className="ph ph-rocket-launch"></i>
                            Preview live — code applies as you generate
                          </a>
                        ) : null}
                      </div>
                    )}
                    <div className="prompt-container overflow-hidden rounded-xl">
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="A landing page for a law firm — trustworthy, professional, navy and gold..."
                      rows={4}
                      className="w-full px-5 py-4 bg-transparent text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none resize-none leading-[1.5] tracking-[-0.01em]"
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
                )}
              </div>

              {deployUrl && (
                <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between gap-3">
                  <span>Preview live — code applies as you generate</span>
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
                    {deployUrl && (
                      <a href={deployUrl} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Open preview">
                        <i className="ph ph-rocket-launch text-lg"></i>
                      </a>
                    )}
                    <button onClick={copyCode} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Copy">
                      {copied ? <i className="ph ph-check text-lg text-emerald-400"></i> : <i className="ph ph-copy text-lg"></i>}
                    </button>
                    <button onClick={downloadProject} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Download as ZIP">
                      <i className="ph ph-download-simple text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 bg-[#0a0a0b]">

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
                            Code applies to your sandbox as it streams. Edits update live.
                          </p>
                          <p className="text-xs text-text-muted mb-4">{Object.keys(generatedProject.files).length} files</p>
                          {deployUrl && (
                            <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="btn-premium inline-flex items-center gap-2 text-[#0a0a0b]">
                              Open preview <i className="ph ph-arrow-square-out"></i>
                            </a>
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
    </>
  );
}

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
  const [deployUrl, setDeployUrl] = useState(null);
  const [sandboxId, setSandboxId] = useState(null);
  const [sandboxStarting, setSandboxStarting] = useState(false);
  const sandboxUpdateTimerRef = useRef(null);
  const lastSentFilesRef = useRef(0);
  const sandboxIdRef = useRef(null);
  const pendingSandboxApplyRef = useRef(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jasmine_history') || '[]'); } catch { return []; }
  });
  const [showImportJson, setShowImportJson] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState('');
  const [importJsonError, setImportJsonError] = useState('');

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('jasmine_theme', theme);
  }, [theme]);

  useEffect(() => {
    sandboxIdRef.current = sandboxId;
    if (sandboxId && pendingSandboxApplyRef.current) {
      const files = pendingSandboxApplyRef.current;
      pendingSandboxApplyRef.current = null;
      (async () => {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '';
          await fetch(`${apiBase}/api/sandbox/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sandboxId, files }),
          });
        } catch (e) {
          console.warn('Sandbox update failed:', e.message);
        }
      })();
    }
  }, [sandboxId]);

  const handleThemeToggle = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('jasmine_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('jasmine_history', JSON.stringify(history.slice(0, 20)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('jasmine_show_landing', String(showLanding));
  }, [showLanding]);

  const sandboxStartedRef = useRef(false);

  useEffect(() => {
    if (showLanding || sandboxStartedRef.current) return;
    sandboxStartedRef.current = true;
    setSandboxStarting(true);
    (async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/sandbox/start`, { method: 'POST' });
        const data = await res.json();
        if (data.success && data.url) {
          setDeployUrl(data.url);
          setSandboxId(data.sandboxId);
          sandboxIdRef.current = data.sandboxId;
        }
      } catch (e) {
        console.warn('Sandbox start failed:', e.message);
        sandboxStartedRef.current = false;
      } finally {
        setSandboxStarting(false);
      }
    })();
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
    lastSentFilesRef.current = 0;
    setChatMessages([{ role: 'user', content: prompt }]);
    setShowLanding(false);
    setRightTab('files');

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      let currentSandboxId = sandboxId;

      if (!currentSandboxId && sandboxStarting) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (sandboxIdRef.current) {
            currentSandboxId = sandboxIdRef.current;
            break;
          }
        }
      }
      if (!currentSandboxId && !sandboxStarting) {
        try {
          const startRes = await fetch(`${apiBase}/api/sandbox/start`, { method: 'POST' });
          const startData = await startRes.json();
          if (startData.success && startData.url) {
            setDeployUrl(startData.url);
            currentSandboxId = startData.sandboxId;
            setSandboxId(currentSandboxId);
          }
        } catch (e) {
          console.warn('Sandbox start skipped:', e.message);
        }
      }

      const scheduleSandboxUpdate = (chunk) => {
        if (!currentSandboxId) return;
        const project = extractNextProject(chunk);
        if (!project?.files) return;
        const count = Object.keys(project.files).length;
        if (count <= lastSentFilesRef.current) return;
        lastSentFilesRef.current = count;
        if (sandboxUpdateTimerRef.current) clearTimeout(sandboxUpdateTimerRef.current);
        sandboxUpdateTimerRef.current = setTimeout(async () => {
          try {
            await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId: currentSandboxId, files: project.files }),
            });
          } catch (e) {
            console.warn('Sandbox update failed:', e.message);
          }
          sandboxUpdateTimerRef.current = null;
        }, 400);
      };

      const onChunk = (chunk) => {
        setStreamingRaw(chunk);
        scheduleSandboxUpdate(chunk);
      };

      const generateFn = provider === 'groq' ? generateWithGroq : generateWithGemini;
      const result = await generateFn(key, prompt, onChunk);

      if (sandboxUpdateTimerRef.current) {
        clearTimeout(sandboxUpdateTimerRef.current);
        sandboxUpdateTimerRef.current = null;
      }

      const project = extractNextProject(result);
      if (project) setGeneratedProject(project);
      setGeneratedHTML(result);

      if (currentSandboxId && project?.files) {
        try {
          await fetch(`${apiBase}/api/sandbox/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sandboxId: currentSandboxId, files: project.files }),
          });
        } catch (e) {
          console.warn('Final sandbox update failed:', e.message);
        }
      }

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

  const downloadProject = async () => {
    try {
      const project = generatedProject || extractNextProject(streamingRaw || generatedHTML);
      await downloadProjectAsZip(project, generatedHTML || streamingRaw);
    } catch (e) {
      setError(e.message || 'Download failed');
    }
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
    setRightTab('files');

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
      if (project?.files) {
        const mergedFiles = { ...(generatedProject?.files || {}), ...project.files };
        setGeneratedProject({ files: mergedFiles });
        if (sandboxId) {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '';
            await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId, files: mergedFiles }),
            });
          } catch (e) {
            console.warn('Sandbox update failed:', e.message);
          }
        }
      }
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
    const project = item.project || extractNextProject(item.html);
    setGeneratedProject(project);
    setPrompt(item.prompt);
    setChatMessages([{ role: 'user', content: item.prompt }, { role: 'assistant', content: 'Loaded.' }]);
    setShowLanding(false);
    if (project?.files) {
      if (sandboxId) {
        (async () => {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '';
            await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId, files: project.files }),
            });
          } catch (e) {
            console.warn('Sandbox update failed:', e.message);
          }
        })();
      } else {
        pendingSandboxApplyRef.current = project.files;
      }
    }
  };

  const loadFromJson = () => {
    setImportJsonError('');
    const project = parseProjectFromJson(importJsonInput.trim());
    if (!project?.files) {
      setImportJsonError('Invalid JSON. Expected { "files": { "path": "content", ... } }');
      return;
    }
    setGeneratedProject(project);
    setGeneratedHTML(projectToRaw(project));
    setStreamingRaw('');
    setChatMessages([{ role: 'user', content: 'Imported from JSON' }, { role: 'assistant', content: `Loaded ${Object.keys(project.files).length} files. You can edit, deploy, or download.` }]);
    setShowLanding(false);
    setShowImportJson(false);
    setImportJsonInput('');
    setRightTab('files');
    if (project?.files) {
      if (sandboxId) {
        (async () => {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '';
            await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId, files: project.files }),
            });
          } catch (e) {
            console.warn('Sandbox update failed:', e.message);
          }
        })();
      } else {
        pendingSandboxApplyRef.current = project.files;
      }
    }
  };

  const hasOutput = generatedHTML || streamingRaw;
  const isLight = theme === 'light';
  const base = 'bg-surface text-text-primary';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'input-premium';

  const appBodyProps = {
    theme,
    showLanding,
    setShowLanding,
    hasOutput,
    isGenerating,
    isEditing,
    rightTab,
    setRightTab,
    prompt,
    setPrompt,
    chatMessages,
    chatInput,
    setChatInput,
    provider,
    setProvider,
    error,
    history,
    loadFromHistory,
    deployUrl,
    sandboxStarting,
    generatedProject,
    streamingRaw,
    generatedHTML,
    showImportJson,
    setShowImportJson,
    importJsonInput,
    setImportJsonInput,
    importJsonError,
    setImportJsonError,
    textareaRef,
    chatEndRef,
    generate,
    handleKeyDown,
    sendChatMessage,
    loadFromJson,
    copyCode,
    downloadProject,
    themeForToggle: theme,
    copied,
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${base}`}>
      <AppBody {...appBodyProps} onThemeToggle={handleThemeToggle} />
    </div>
  );
}

export default App;
