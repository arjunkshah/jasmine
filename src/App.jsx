import { useState, useRef, useEffect, useCallback } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { generateWithGroq, generateWithGemini, editWithGroq, editWithGemini, extractNextProject, replaceImagePlaceholders, fixProjectErrors, ensurePackageDependencies } from './api';
import { downloadProjectAsZip } from './downloadZip';
import LandingPage from './LandingPage';
import FileExplorer from './FileExplorer';
import AuthPage from './components/AuthPage';
import ProjectSidebar from './components/ProjectSidebar';
import { useAuth } from './contexts/AuthContext';
import { createProject, updateProject, listProjects, getProject, deleteProject } from './lib/projects';

async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text?.slice(0, 100) || `Request failed: ${res.status}`);
  }
}

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
  deployUrl,
  sandboxStarting,
  previewRetryKey,
  setPreviewRetryKey,
  generatedProject,
  streamingRaw,
  generatedHTML,
  textareaRef,
  chatEndRef,
  generate,
  handleKeyDown,
  sendChatMessage,
  contextFiles,
  setContextFiles,
  fileInputRef,
  downloadProject,
  deployToNetlify,
  netlifyDeploying,
  netlifyUrl,
  onThemeToggle,
  themeForToggle,
  retrySandbox,
  retryPreviewUpdate,
  sidebarOpen,
  onToggleSidebar,
  user,
  onSignInClick,
  onSignOut,
  firebaseConfigured,
  onStartDesigning,
  onSelectPrompt,
}) {
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'input-premium';

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const read = (f) => new Promise((resolve) => {
      if (f.size > 100 * 1024) return resolve(null);
      const r = new FileReader();
      r.onload = () => resolve({ name: f.name, content: r.result });
      r.readAsText(f);
    });
    const results = (await Promise.all(files.map(read))).filter(Boolean);
    setContextFiles((prev) => [...prev, ...results].slice(0, 5));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.css,.html,.yaml,.yml"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <header className={`flex-none border-b ${borderCl} bg-surface z-50`}>
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            {firebaseConfigured && !sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                title="Open projects"
              >
                <i className="ph ph-folder text-lg"></i>
              </button>
            )}
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">jasmine</span>
              <span className="text-[10px] text-text-muted tracking-wider">ai</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
            {firebaseConfigured && (
              user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04]">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-jasmine-400/20 flex items-center justify-center text-jasmine-400 text-sm font-medium">
                        {(user.displayName || user.email)?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                    <span className="text-sm max-w-[120px] truncate hidden sm:inline">{user.displayName || user.email}</span>
                    <i className="ph ph-caret-down text-xs"></i>
                  </button>
                  <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]`}>
                    <button onClick={onSignOut} className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] flex items-center gap-2">
                      <i className="ph ph-sign-out"></i>
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={onSignInClick} className="btn-premium px-3 py-1.5 text-sm">
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 min-w-0">
        {showLanding && !hasOutput ? (
          <LandingPage
            onStartDesigning={onStartDesigning}
            onSelectPrompt={onSelectPrompt}
            theme={theme}
          />
        ) : hasOutput ? (
          <Group orientation="horizontal" id="jasmine-split" className="flex-1 min-h-0 min-w-0" resizeTargetMinimumSize={{ fine: 32, coarse: 44 }}>
            <Panel defaultSize="50" minSize="35" maxSize="75" className="flex flex-col min-w-0 overflow-hidden">
            <div className={`flex flex-1 flex-col min-h-0 border-r ${borderCl}`}>
              <div className={`flex-1 flex flex-col min-w-0 ${hasOutput ? 'flex overflow-hidden' : 'flex items-center justify-center p-6 sm:p-8'}`}>
                {hasOutput ? (
                  <>
                    <div className={`flex-none px-4 py-3 border-b ${borderCl}`}>
                      <p className="text-xs text-text-muted tracking-wider">chat</p>
                      <p className="text-sm text-text-secondary mt-0.5">ask to edit your design</p>
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
                      {contextFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {contextFiles.map((f, i) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-white/10 text-text-secondary'}`}>
                              <i className="ph ph-file-text"></i>
                              {f.name}
                              <button type="button" onClick={() => setContextFiles((prev) => prev.filter((_, j) => j !== i))} className="hover:text-text-primary">
                                <i className="ph ph-x text-sm"></i>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-2.5 rounded-xl border ${borderCl} ${isLight ? 'text-zinc-600 hover:bg-zinc-50' : 'text-text-muted hover:bg-white/[0.04]'}`}
                          title="Attach files as context"
                        >
                          <i className="ph ph-paperclip"></i>
                        </button>
                        <input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                          placeholder="Make the header darker..."
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${borderCl} text-text-primary placeholder:text-text-muted focus:outline-none ${isLight ? 'bg-zinc-50' : 'bg-white/[0.04]'}`}
                        />
                        <button onClick={sendChatMessage} disabled={!chatInput.trim() || isEditing} className="btn-premium px-6 py-2.5 text-sm disabled:opacity-40">
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
                      the world's best designer. one prompt.
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
                    {contextFiles.length > 0 && (
                      <div className={`px-4 py-2 border-t ${borderCl} flex flex-wrap gap-2`}>
                        {contextFiles.map((f, i) => (
                          <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-white/10 text-text-secondary'}`}>
                            <i className="ph ph-file-text"></i>
                            {f.name}
                            <button type="button" onClick={() => setContextFiles((prev) => prev.filter((_, j) => j !== i))} className="hover:text-text-primary">
                              <i className="ph ph-x text-sm"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={`flex items-center justify-between px-4 py-2.5 border-t ${borderCl}`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg ${isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-text-muted hover:bg-white/[0.06]'}`}
                          title="Attach files as context for the AI (txt, md, json, etc.)"
                        >
                          <i className="ph ph-paperclip"></i>
                          Attach
                        </button>
                        <div className={`flex items-center rounded-lg p-0.5 border ${borderCl} ${isLight ? 'bg-zinc-100/80' : 'bg-white/[0.04]'}`}>
                          <button
                            onClick={() => setProvider('groq')}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                              provider === 'groq' ? (isLight ? 'bg-white text-text-primary shadow-sm border border-zinc-200' : 'bg-white/[0.08] text-text-primary') : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <i className={`ph ${provider === 'groq' ? 'ph-fill' : 'ph'} ph-lightning text-sm`}></i>
                              Kimi K2 0905
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
                        onClick={firebaseConfigured && !user ? onSignInClick : generate}
                        disabled={isGenerating}
                        className="btn-premium flex items-center gap-2 px-8 py-3 text-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        {isGenerating ? (
                          <>
                            <i className="ph ph-circle-notch text-lg animate-spin-slow"></i>
                            <span>Generating</span>
                          </>
                        ) : firebaseConfigured && !user ? (
                          <>
                            <i className="ph ph-sign-in text-lg"></i>
                            <span>Sign in to generate</span>
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
              {netlifyUrl && (
                <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-jasmine-500/10 border border-jasmine-500/20 text-jasmine-400 text-sm flex items-center justify-between gap-3">
                  <span>Deployed to Netlify</span>
                  <a href={netlifyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                    View site <i className="ph ph-arrow-square-out text-base"></i>
                  </a>
                </div>
              )}
              {error && (
                <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span>{error}</span>
                    {error.toLowerCase().includes('preview update') ? (
                      <button onClick={retryPreviewUpdate} className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium">
                        Retry
                      </button>
                    ) : error.toLowerCase().includes('sandbox') ? (
                      <button onClick={retrySandbox} className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium">
                        Retry
                      </button>
                    ) : null}
                  </div>
                  {error.toLowerCase().includes('sandbox') && hasOutput && (
                    <p className="text-emerald-400/90 text-xs">
                      Your project is ready — download the ZIP and run <code className="bg-white/10 px-1 rounded">npm install && npm run dev</code> locally.
                    </p>
                  )}
                </div>
              )}
            </div>
            </Panel>
            <Separator
              className={`w-6 shrink-0 cursor-col-resize flex items-center justify-center transition-colors hover:bg-white/10 active:bg-jasmine-400/20 ${borderCl} border-r`}
            />
            <Panel defaultSize="50" minSize="25" maxSize="65" className="flex flex-col min-w-0 overflow-hidden">
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
                        <i className="ph ph-eye text-lg"></i>
                      </a>
                    )}
                    <button
                      onClick={deployToNetlify}
                      disabled={netlifyDeploying || !generatedProject?.files}
                      className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Deploy to Netlify"
                    >
                      {netlifyDeploying ? <i className="ph ph-circle-notch text-lg animate-spin"></i> : <i className="ph ph-rocket-launch text-lg"></i>}
                    </button>
                    <button onClick={downloadProject} className={`p-2 rounded-lg ${ghostCl} text-text-muted hover:text-text-secondary`} title="Download as ZIP">
                      <i className="ph ph-download-simple text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className={`flex-1 relative min-h-0 ${isLight ? 'bg-zinc-50' : 'bg-surface-raised'}`}>

                  {rightTab === 'files' && (
                    <div className="absolute inset-0">
                      <FileExplorer
                        files={generatedProject?.files}
                        streamingRaw={streamingRaw || generatedHTML}
                        isStreaming={isGenerating || isEditing}
                        theme={theme}
                      />
                    </div>
                  )}

                  {rightTab === 'preview' && (
                    <div className="absolute inset-0 flex flex-col overflow-hidden">
                      {deployUrl ? (
                        <>
                          <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-zinc-800 gap-2">
                            <span className="text-xs text-text-muted">Live preview</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewRetryKey((k) => k + 1)}
                                className="text-xs text-jasmine-400 hover:text-jasmine-300 flex items-center gap-1"
                              >
                                Retry <i className="ph ph-arrow-clockwise text-sm"></i>
                              </button>
                              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-jasmine-400 hover:text-jasmine-300 flex items-center gap-1">
                                Open <i className="ph ph-arrow-square-out text-sm"></i>
                              </a>
                            </div>
                          </div>
                          <iframe
                            key={previewRetryKey}
                            src={deployUrl}
                            title="Preview"
                            className="flex-1 w-full min-h-0 border-0 bg-white"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </>
                      ) : generatedProject?.files ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                          <div className="text-center max-w-md">
                            <i className="ph ph-rocket-launch text-4xl text-jasmine-400 mb-4 block"></i>
                            <p className="text-text-primary font-semibold mb-2">Project generated</p>
                            <p className="text-sm text-text-muted mb-4">
                              Sandbox is starting… Preview will appear here.
                            </p>
                            <p className="text-xs text-text-muted">{Object.keys(generatedProject.files).length} files</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-text-muted">
                          <div className="text-center">
                            <p className="mb-2">{(isGenerating || isEditing) ? 'Generating...' : 'No project yet.'}</p>
                            <p className="text-sm">Switch to Files to see code.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </Group>
        ) : (
          <div className={`flex-1 flex flex-col min-w-0 border-r ${borderCl}`}>
            <div className="flex-1 flex flex-col min-w-0 flex items-center justify-center p-6 sm:p-8">
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
                  the world's best designer. one prompt.
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
                {contextFiles.length > 0 && (
                  <div className={`px-4 py-2 border-t ${borderCl} flex flex-wrap gap-2`}>
                    {contextFiles.map((f, i) => (
                      <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-white/10 text-text-secondary'}`}>
                        <i className="ph ph-file-text"></i>
                        {f.name}
                        <button type="button" onClick={() => setContextFiles((prev) => prev.filter((_, j) => j !== i))} className="hover:text-text-primary">
                          <i className="ph ph-x text-sm"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={`flex items-center justify-between px-4 py-2.5 border-t ${borderCl}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg ${isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-text-muted hover:bg-white/[0.06]'}`}
                      title="Attach files as context for the AI (txt, md, json, etc.)"
                    >
                      <i className="ph ph-paperclip"></i>
                      Attach
                    </button>
                    <div className={`flex items-center rounded-lg p-0.5 border ${borderCl} ${isLight ? 'bg-zinc-100/80' : 'bg-white/[0.04]'}`}>
                      <button
                        onClick={() => setProvider('groq')}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          provider === 'groq' ? (isLight ? 'bg-white text-text-primary shadow-sm border border-zinc-200' : 'bg-white/[0.08] text-text-primary') : 'text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <i className={`ph ${provider === 'groq' ? 'ph-fill' : 'ph'} ph-lightning text-sm`}></i>
                          Kimi K2 0905
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
                    onClick={firebaseConfigured && !user ? onSignInClick : generate}
                    disabled={isGenerating}
                    className="btn-premium flex items-center gap-2 px-8 py-3 text-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    {isGenerating ? (
                      <>
                        <i className="ph ph-circle-notch text-lg animate-spin-slow"></i>
                        <span>Generating</span>
                      </>
                    ) : firebaseConfigured && !user ? (
                      <>
                        <i className="ph ph-sign-in text-lg"></i>
                        <span>Sign in to generate</span>
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
            </div>
            {(deployUrl || netlifyUrl || error) && (
              <div className="flex-none space-y-0">
                {deployUrl && (
                  <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between gap-3">
                    <span>Preview live — code applies as you generate</span>
                    <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                      Open <i className="ph ph-arrow-square-out text-base"></i>
                    </a>
                  </div>
                )}
                {netlifyUrl && (
                  <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-jasmine-500/10 border border-jasmine-500/20 text-jasmine-400 text-sm flex items-center justify-between gap-3">
                    <span>Deployed to Netlify</span>
                    <a href={netlifyUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                      View site <i className="ph ph-rocket-launch text-base"></i>
                    </a>
                  </div>
                )}
                {error && (
                  <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span>{error}</span>
                      {error.toLowerCase().includes('preview update') ? (
                        <button onClick={retryPreviewUpdate} className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium">
                          Retry
                        </button>
                      ) : error.toLowerCase().includes('sandbox') ? (
                        <button onClick={retrySandbox} className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium">
                          Retry
                        </button>
                      ) : null}
                    </div>
                    {error.toLowerCase().includes('sandbox') && hasOutput && (
                      <p className="text-emerald-400/90 text-xs">
                        Your project is ready — download the ZIP and run <code className="bg-white/10 px-1 rounded">npm install && npm run dev</code> locally.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut, isConfigured: firebaseConfigured } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rightTab, setRightTab] = useState('files');
  const [chatMessages, setChatMessages] = useState([]);
  const [netlifyDeploying, setNetlifyDeploying] = useState(false);
  const [netlifyUrl, setNetlifyUrl] = useState(null);
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
  const [sandboxRetryTrigger, setSandboxRetryTrigger] = useState(0);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const sandboxIdRef = useRef(null);
  const pendingSandboxApplyRef = useRef(null);
  const [contextFiles, setContextFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authClosing, setAuthClosing] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const saveTimeoutRef = useRef(null);

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

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
      ensurePackageDependencies(files);
      (async () => {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '';
          console.log('[Jasmine] POST /api/sandbox/update (pending apply)', Object.keys(files).length, 'files');
          const res = await fetch(`${apiBase}/api/sandbox/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sandboxId, files }),
          });
          if (!res.ok) console.warn('[Jasmine] sandbox/update (pending apply)', res.status);
          else console.log('[Jasmine] sandbox/update (pending apply) ok');
        } catch (e) {
          console.warn('[Jasmine] sandbox update (pending apply) failed:', e?.message);
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
    localStorage.setItem('jasmine_show_landing', String(showLanding));
  }, [showLanding]);

  // Fetch projects when user logs in
  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setProjects([]);
      return;
    }
    setLoadingProjects(true);
    listProjects(user.uid)
      .then(setProjects)
      .catch((e) => console.warn('[Jasmine] listProjects failed:', e?.message))
      .finally(() => setLoadingProjects(false));
  }, [firebaseConfigured, user?.uid]);

  const saveProject = useCallback(
    async (data) => {
      if (!firebaseConfigured || !user) return;
      const payload = {
        name: data.name || prompt?.slice(0, 50) || 'Untitled',
        prompt: data.prompt ?? prompt,
        files: data.files ?? generatedProject?.files ?? {},
        html: data.html ?? generatedHTML,
        chatMessages: data.chatMessages ?? chatMessages,
        provider: data.provider ?? provider,
      };
      try {
        if (currentProjectId) {
          await updateProject(currentProjectId, payload);
          setProjects((prev) =>
            prev.map((p) => (p.id === currentProjectId ? { ...p, ...payload } : p))
          );
        } else if (payload.files && Object.keys(payload.files).length > 0) {
          const id = await createProject(user.uid, payload);
          setCurrentProjectId(id);
          setProjects((prev) => [{ id, ...payload }, ...prev]);
        }
      } catch (e) {
        console.warn('[Jasmine] saveProject failed:', e?.message);
      }
    },
    [firebaseConfigured, user, currentProjectId, prompt, generatedProject, generatedHTML, chatMessages, provider]
  );

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveProject({});
      saveTimeoutRef.current = null;
    }, 1500);
  }, [saveProject]);

  const loadProject = useCallback(async (project) => {
    const full = project.id ? await getProject(project.id) : project;
    if (!full) return;
    setPrompt(full.prompt || '');
    setGeneratedProject(full.files ? { files: full.files } : null);
    setGeneratedHTML(full.html || '');
    setStreamingRaw('');
    setChatMessages(full.chatMessages?.length ? full.chatMessages : [{ role: 'user', content: full.prompt || '' }, { role: 'assistant', content: 'Loaded.' }]);
    setProvider(full.provider || 'groq');
    setCurrentProjectId(full.id);
    setShowLanding(false);
    setRightTab('files');
    setSidebarOpen(false);
    if (full.files && Object.keys(full.files).length > 0) {
      pendingSandboxApplyRef.current = full.files;
    }
  }, []);

  const handleDeleteProject = useCallback(async (project) => {
    if (!project?.id || !firebaseConfigured || !user) return;
    if (!confirm(`Delete "${project.name || 'Untitled'}"?`)) return;
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      if (currentProjectId === project.id) {
        setCurrentProjectId(null);
        setPrompt('');
        setGeneratedProject(null);
        setGeneratedHTML('');
        setStreamingRaw('');
        setChatMessages([]);
        setShowLanding(true);
      }
    } catch (e) {
      console.warn('[Jasmine] deleteProject failed:', e?.message);
    }
  }, [firebaseConfigured, user, currentProjectId]);

  const handleNewProject = useCallback(() => {
    setCurrentProjectId(null);
    setPrompt('');
    setGeneratedProject(null);
    setGeneratedHTML('');
    setStreamingRaw('');
    setChatMessages([]);
    setShowLanding(true);
    setSidebarOpen(false);
  }, []);

  const spinUpSandbox = useCallback(async (project) => {
    const files = project.files;
    if (!files || Object.keys(files).length === 0) return;
    setSandboxStarting(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/sandbox/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      const data = await parseJsonResponse(res);
      if (data.success && data.sandboxId && data.url) {
        setDeployUrl(data.url);
        setSandboxId(data.sandboxId);
        const updRes = await fetch(`${apiBase}/api/sandbox/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId: data.sandboxId, files }),
        });
        if (!updRes.ok) console.warn('[Jasmine] sandbox/update failed:', updRes.status);
        setPreviewRetryKey((k) => k + 1);
        setRightTab('preview');
      } else {
        setError(data?.error || 'Sandbox start failed');
      }
    } catch (e) {
      setError(e?.message || 'Sandbox failed');
    } finally {
      setSandboxStarting(false);
    }
  }, [theme]);

  const sandboxStartedRef = useRef(false);

  const retrySandbox = () => {
    sandboxStartedRef.current = false;
    setError('');
    setSandboxRetryTrigger((t) => t + 1);
  };

  const retryPreviewUpdate = useCallback(async () => {
    const files = generatedProject?.files;
    const sid = sandboxId;
    if (!sid || !files || Object.keys(files).length === 0) return;
    ensurePackageDependencies(files);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/sandbox/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: sid, files }),
      });
      if (res.ok) {
        setPreviewRetryKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Preview update failed. Try again.');
      }
    } catch (e) {
      setError(e?.message || 'Preview update failed. Try again.');
    }
  }, [generatedProject?.files, sandboxId]);

  useEffect(() => {
    if (showLanding || sandboxStartedRef.current) return;
    sandboxStartedRef.current = true;
    setSandboxStarting(true);
    (async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        console.log('[Jasmine] POST /api/sandbox/start', apiBase || '(same origin)');
        const res = await fetch(`${apiBase}/api/sandbox/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }),
        });
        const data = await parseJsonResponse(res);
        console.log('[Jasmine] sandbox/start', res.status, data?.success ? `ok sandboxId=${data.sandboxId} url=${data.url}` : `error=${data?.error}`);
        if (data.success && data.url) {
          setDeployUrl(data.url);
          setSandboxId(data.sandboxId);
          sandboxIdRef.current = data.sandboxId;
        } else if (data.error) {
          console.warn('[Jasmine] sandbox/start error:', data.error);
          const msg = data.error.includes('E2B_API_KEY')
            ? `Sandbox: ${data.error} Add E2B_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.`
            : `Sandbox: ${data.error}`;
          setError(msg);
          sandboxStartedRef.current = false;
        }
      } catch (e) {
        console.error('[Jasmine] sandbox/start failed:', e?.message, e);
        const hint = typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
          ? ' Check /api/health on your deployment.'
          : '';
        setError(`Sandbox start failed: ${e.message}${hint}`);
        sandboxStartedRef.current = false;
      } finally {
        setSandboxStarting(false);
      }
    })();
  }, [showLanding, sandboxRetryTrigger, theme]);

  const generate = async () => {
    if (firebaseConfigured && !user) {
      setShowAuthModal(true);
      setError('Sign in to generate');
      return;
    }
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
    setCurrentProjectId(null);
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
          console.log('[Jasmine] POST /api/sandbox/start (generate flow)');
          const startRes = await fetch(`${apiBase}/api/sandbox/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme }),
          });
          const startData = await parseJsonResponse(startRes);
          console.log('[Jasmine] sandbox/start (generate)', startRes.status, startData?.success ? `ok sandboxId=${startData.sandboxId}` : `error=${startData?.error}`);
          if (startData.success && startData.url) {
            setDeployUrl(startData.url);
            currentSandboxId = startData.sandboxId;
            setSandboxId(currentSandboxId);
          }
        } catch (e) {
          console.warn('[Jasmine] sandbox start skipped:', e?.message);
        }
      }

      // Only send sandbox update when generation completes (final update below).
      // Streaming updates caused 20+ rebuilds per project, 504 timeouts, and port errors.
      const onChunk = (chunk) => setStreamingRaw(chunk);

      const generateFn = provider === 'groq' ? generateWithGroq : generateWithGemini;
      let result = await generateFn(key, prompt, onChunk, contextFiles);

      const project = extractNextProject(result);
      if (project?.files) {
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const replaced = {};
        for (const [path, content] of Object.entries(project.files)) {
          replaced[path] = await replaceImagePlaceholders(String(content), apiBase, geminiKey);
        }
        project.files = replaced;
      }
      if (project) setGeneratedProject(project);
      setGeneratedHTML(result);

      // Post-generation: use other model to check and fix errors
      if (project?.files) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const fixedFiles = await fixProjectErrors(project, provider, groqKey, geminiKey);
        if (fixedFiles && Object.keys(fixedFiles).length > 0) {
          project.files = fixedFiles;
          setGeneratedProject({ ...project, files: fixedFiles });
        }
        // Guarantee package.json has react-router-dom, @phosphor-icons/react (model sometimes omits)
        ensurePackageDependencies(project.files);
      }
      // Note: fix pass runs after images; sandbox update below uses latest project.files

      if (currentSandboxId && project?.files) {
        let updated = false;
        for (let attempt = 0; attempt < 2 && !updated; attempt++) {
          try {
            const updRes = await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId: currentSandboxId, files: project.files }),
            });
            if (updRes.ok) {
              updated = true;
            } else if (updRes.status === 504 && attempt < 1) {
              console.warn('[Jasmine] sandbox/update 504, retrying...');
              await new Promise((r) => setTimeout(r, 3000));
            } else {
              setError('Preview update failed. Click Retry to apply your code.');
            }
          } catch (e) {
            console.warn('[Jasmine] sandbox update failed:', e?.message);
            if (attempt < 1) await new Promise((r) => setTimeout(r, 3000));
            else setError('Preview update failed. Click Retry to apply your code.');
          }
        }
      }

      console.log('[Jasmine] generate complete', project ? Object.keys(project.files).length + ' files' : 'no project');
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'I\'ve generated your project. Ask me to edit it — e.g. "Make the header darker" or "Add a pricing section".' }]);
      if (firebaseConfigured && user && project?.files) {
        const finalMessages = [...chatMessages, { role: 'assistant', content: 'I\'ve generated your project. Ask me to edit it — e.g. "Make the header darker" or "Add a pricing section".' }];
        try {
          await saveProject({ files: project.files, html: result, chatMessages: finalMessages });
          listProjects(user.uid).then(setProjects).catch(() => {});
        } catch (e) {
          setProjects((prev) => {
            const entry = { id: `temp-${Date.now()}`, name: prompt?.slice(0, 50) || 'Untitled', prompt, files: project.files, ...project };
            return [entry, ...prev.filter((p) => !p.id?.startsWith('temp-'))];
          });
        }
      }
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

  const deployToNetlify = async () => {
    const files = generatedProject?.files;
    const sid = sandboxId;
    if (!files || Object.keys(files).length === 0) {
      setError('Generate a project first');
      return;
    }
    setNetlifyDeploying(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/netlify/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: sid, files }),
      });
      const data = await parseJsonResponse(res);
      if (data.success && data.url) {
        setNetlifyUrl(data.url);
      } else {
        setError(data?.error || 'Deploy failed');
      }
    } catch (e) {
      setError(e?.message || 'Deploy failed');
    } finally {
      setNetlifyDeploying(false);
    }
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
      const result = await editFn(key, currentCode, msg, (chunk) => setStreamingRaw(chunk), contextFiles);
      const project = extractNextProject(result);
      if (project?.files) {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const replaced = {};
        for (const [path, content] of Object.entries(project.files)) {
          replaced[path] = await replaceImagePlaceholders(String(content), apiBase, geminiKey);
        }
        const mergedFiles = { ...(generatedProject?.files || {}), ...replaced };
        ensurePackageDependencies(mergedFiles);
        setGeneratedProject({ files: mergedFiles });
        if (sandboxId) {
          try {
            await fetch(`${apiBase}/api/sandbox/update`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sandboxId, files: mergedFiles }),
            });
          } catch (e) {
            console.warn('[Jasmine] sandbox update (edit) failed:', e?.message);
          }
        }
      }
      setGeneratedHTML(result);
      console.log('[Jasmine] edit complete', project?.files ? Object.keys(project.files).length + ' files' : '');
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Done. Check the Files tab.' }]);
      setRightTab('files');
      if (firebaseConfigured && user) debouncedSave();
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsEditing(false);
    }
  };

  const hasOutput = generatedHTML || streamingRaw;
  const isLight = theme === 'light';
  const base = 'bg-surface text-text-primary';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200' : 'btn-ghost';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'input-premium';

  const goToDesigner = useCallback(() => {
    setShowLanding(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleStartDesigning = useCallback(() => {
    if (firebaseConfigured && !user) {
      setPendingAfterAuth(goToDesigner);
      setShowAuthModal(true);
    } else {
      goToDesigner();
    }
  }, [firebaseConfigured, user, goToDesigner]);

  const handleSelectPrompt = useCallback((p) => {
    if (firebaseConfigured && !user) {
      setPrompt(p);
      setPendingAfterAuth(goToDesigner);
      setShowAuthModal(true);
    } else {
      setPrompt(p);
      goToDesigner();
    }
  }, [firebaseConfigured, user, goToDesigner]);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAfterAuth) {
      pendingAfterAuth();
      setPendingAfterAuth(null);
    }
  }, [pendingAfterAuth]);

  const handleAuthModalClose = useCallback(() => {
    setAuthClosing(true);
    setTimeout(() => {
      setPendingAfterAuth(null);
      setShowAuthModal(false);
      setAuthClosing(false);
    }, 300);
  }, []);

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
    deployUrl,
    sandboxStarting,
    previewRetryKey,
    setPreviewRetryKey,
    generatedProject,
    streamingRaw,
    generatedHTML,
  textareaRef,
  chatEndRef,
  generate,
  handleKeyDown,
  sendChatMessage,
  contextFiles,
  setContextFiles,
  fileInputRef,
  downloadProject,
    deployToNetlify,
    netlifyDeploying,
    netlifyUrl,
  themeForToggle: theme,
  retrySandbox,
    retryPreviewUpdate,
    sidebarOpen,
    onToggleSidebar: () => setSidebarOpen((o) => !o),
    user,
    onSignInClick: () => setShowAuthModal(true),
    onSignOut: signOut,
    firebaseConfigured,
    onStartDesigning: handleStartDesigning,
    onSelectPrompt: handleSelectPrompt,
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <i className="ph ph-circle-notch animate-spin text-3xl text-jasmine-400"></i>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans ${base}`}>
      <div className="flex-1 flex min-h-0 min-w-0">
        {firebaseConfigured && (
          <ProjectSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(false)}
            user={user}
            projects={projects}
            onLoadProject={loadProject}
            onDeleteProject={handleDeleteProject}
            onNewProject={handleNewProject}
            onSpinUpSandbox={spinUpSandbox}
            loadingProjects={loadingProjects}
            theme={theme}
          />
        )}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <AppBody {...appBodyProps} onThemeToggle={handleThemeToggle} />
        </div>
      </div>
      {showAuthModal && (
        <AuthPage
          onClose={handleAuthModalClose}
          isClosing={authClosing}
          onSuccess={handleAuthSuccess}
          onSignIn={signIn}
          onSignUp={signUp}
          onGoogle={signInWithGoogle}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;
