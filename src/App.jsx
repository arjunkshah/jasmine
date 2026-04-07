import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { extractNextProject, extractSlashCommands, replaceImagePlaceholders, ensurePackageDependencies, applyPackageFixes, getHtmlPreviewContent, webSearch, parseFilesFromRaw } from './api';
import { JASMINE_SYSTEM_PROMPT } from './systemPrompt.js';
import { downloadProjectAsZip } from './downloadZip';
import LandingPage from './pages/LandingPage';
import BlogPage from './pages/BlogPage';
import DocsPage from './pages/DocsPage';
import NotificationsPage from './pages/NotificationsPage';
import WaitlistPage from './pages/WaitlistPage';
import PasswordGate from './components/PasswordGate';
import FileExplorer from './FileExplorer';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import AuthPage from './components/AuthPage';
import StatusBubble from './components/StatusBubble';
import ProjectSidebar from './components/ProjectSidebar';
import CommandPalette from './components/CommandPalette';
import EditableHtmlPreview from './components/EditableHtmlPreview';
import ShareModal from './components/ShareModal';
import { useAuth } from './contexts/AuthContext';
import { createProject, updateProject, listProjects, listSharedWithMe, getProject, deleteProject } from './lib/projects';
import { trackGeneration, trackEdit, trackDeploy } from './lib/analytics';

const EASE = [0.22, 1, 0.36, 1];

/** Set to true to show waitlist on / and password gate on /website. Set to false to go straight to the website. */
const WAITLIST_ENABLED = true;

function FilePreviewChip({ f, i, onRemove, isLight, compact }) {
  const chipCl = isLight ? 'bg-[#f6f4ec] text-text-secondary border border-[rgba(220,211,195,0.9)]' : 'bg-white/10 text-text-secondary border border-white/10';
  const isImage = f.type === 'image' && f.dataUrl;
  const thumbSize = compact ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <motion.span
      key={`${f.name}-${i}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`inline-flex items-center gap-2 rounded-lg overflow-hidden ${compact ? 'px-2 py-1' : 'px-2 py-1.5'} ${chipCl}`}
    >
      {isImage ? (
        <img src={f.dataUrl} alt="" className={`${thumbSize} object-cover rounded flex-shrink-0`} />
      ) : (
        <i className={`ph ${f.type === 'binary' ? 'ph-file' : 'ph-file-text'} ${compact ? 'text-[10px]' : 'text-sm'} flex-shrink-0`} />
      )}
      <span className={`truncate ${compact ? 'max-w-[120px] text-xs' : 'max-w-[140px] text-sm'}`}>{f.name}</span>
      <button type="button" onClick={() => onRemove(i)} className="hover:text-text-primary transition-colors flex-shrink-0">
        <i className={`ph ph-x ${compact ? 'text-[10px]' : 'text-sm'}`} />
      </button>
    </motion.span>
  );
}

function AttachedFilesSection({ contextFiles, setContextFiles, isLight }) {
  return (
    <AnimatePresence mode="wait">
      {contextFiles.length > 0 ? (
        <motion.div
          key="files"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="overflow-hidden mb-2"
        >
          <div className="flex flex-wrap gap-2">
            {contextFiles.map((f, i) => (
              <FilePreviewChip
                key={`${f.name}-${i}`}
                f={f}
                i={i}
                onRemove={(idx) => setContextFiles((prev) => prev.filter((_, j) => j !== idx))}
                isLight={isLight}
                compact
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text?.slice(0, 100) || `Request failed: ${res.status}`);
  }
}

/** Execute slash commands parsed from AI output. */
async function runSlashCommands(commands, ctx) {
  const { deployUrl, netlifyUrl, generatedProject, setChatMessages, setError, downloadProject } = ctx;
  const BACKEND_UNAVAILABLE = 'Preview/sandbox backend removed. Use /download to get your project.';
  for (const { cmd, arg } of commands) {
    try {
      if (['sandbox-state', 'create', 'apply', 'deploy', 'fix-errors', 'netlify-deploy', 'generate-image', 'health', 'create-and-apply'].includes(cmd)) {
        setChatMessages((prev) => [...prev, { role: 'status', message: BACKEND_UNAVAILABLE, details: [], icon: 'ph-warning' }]);
      } else if (cmd === 'retry') {
        setChatMessages((prev) => [...prev, { role: 'status', message: BACKEND_UNAVAILABLE, details: [], icon: 'ph-warning' }]);
      } else if (cmd === 'web-search' && arg) {
        const results = await webSearch();
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: `Web search: ${arg}`,
          details: results?.slice(0, 5).map((r) => r.title || r.link) || [],
          icon: 'ph-magnifying-glass',
        }]);
      } else if (cmd === 'download' && downloadProject) {
        await downloadProject();
        setChatMessages((prev) => [...prev, { role: 'status', message: 'Download started', details: [], icon: 'ph-download-simple' }]);
      } else if (cmd === 'open-preview') {
        const url = deployUrl || netlifyUrl;
        if (url) {
          window.open(url, '_blank', 'noopener');
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Opened preview in new tab', details: [url], icon: 'ph-browser' }]);
        } else {
          setChatMessages((prev) => [...prev, { role: 'status', message: 'No preview URL. Use /download to get your project.', details: [], icon: 'ph-warning' }]);
        }
      } else if (cmd === 'copy-url') {
        const url = deployUrl || netlifyUrl;
        if (url) {
          try {
            await navigator.clipboard.writeText(url);
            setChatMessages((prev) => [...prev, { role: 'status', message: 'URL copied to clipboard', details: [url], icon: 'ph-copy' }]);
          } catch {
            setError('Clipboard access denied');
          }
        } else {
          setChatMessages((prev) => [...prev, { role: 'status', message: 'No preview URL. Use /download to get your project.', details: [], icon: 'ph-warning' }]);
        }
      } else if (cmd === 'list-files' && generatedProject?.files) {
        const paths = Object.keys(generatedProject.files).sort();
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: `${paths.length} files`,
          details: paths,
          icon: 'ph-file-code',
        }]);
      } else if (cmd === 'help') {
        const cmds = ['/web-search <query>', '/download', '/list-files', '/open-preview', '/copy-url', '/help'];
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: 'Available commands',
          details: cmds,
          icon: 'ph-list',
        }]);
      }
    } catch (e) {
      console.warn('[Jasmine] slash command failed:', cmd, e?.message);
      setError(e?.message || `Command /${cmd} failed`);
    }
  }
}

function AppBody({
  theme,
  activePage,
  onShowHome,
  onShowBlog,
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
  scrollChatToEnd,
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
  githubUrl,
  onThemeToggle,
  themeForToggle,
  onOpenCommandPalette,
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
  onOpenPost,
  onBackToList,
  onShowDocs,
  onShowNotifications,
  onLoadProject,
  onRefreshSharedProjects,
  sharedProjects,
  loadingSharedProjects,
  blogSlug,
  sharedProjectsCount,
}) {
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-[#f6f4ec] hover:bg-[#e9dfcf] border-[rgba(220,211,195,0.9)] text-text-primary' : 'btn-ghost';
  const inputCl = isLight ? 'bg-[#fffaf0] border-[rgba(220,211,195,0.9)] focus:border-[#379f57]' : 'input-premium';
  const navCl = (page) => (
    activePage === page
      ? `px-3 py-2 rounded-lg text-sm border ${borderCl} ${isLight ? 'bg-white text-text-primary' : 'bg-white/[0.04] text-text-primary'}`
      : 'px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors'
  );
  const marketingView = activePage !== 'designer';

  const IMAGE_EXT = /\.(png|jpg|jpeg|webp|gif)$/i;
  const BINARY_EXT = /\.(docx|pdf)$/i;
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const read = (f) => new Promise((resolve) => {
      if (f.size > 2 * 1024 * 1024) return resolve(null); // 2MB max
      const isImage = IMAGE_EXT.test(f.name);
      const isBinary = BINARY_EXT.test(f.name);
      if (isImage) {
        const r = new FileReader();
        r.onload = () => resolve({ name: f.name, content: `[Image: ${f.name}]`, type: 'image', dataUrl: r.result });
        r.readAsDataURL(f);
      } else if (isBinary) {
        resolve({ name: f.name, content: '', type: 'binary' });
      } else {
        const r = new FileReader();
        r.onload = () => resolve({ name: f.name, content: typeof r.result === 'string' ? r.result : '', type: 'text' });
        r.readAsText(f);
      }
    });
    const results = (await Promise.all(files.map(read))).filter(Boolean);
    setContextFiles((prev) => [...prev, ...results].slice(0, 8));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.css,.html,.yaml,.yml,.docx,.pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <header className={`flex-none border-b ${borderCl} bg-surface z-50`}>
          <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-6 min-w-0">
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
              <button
                type="button"
                onClick={onShowHome}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-white/[0.04]"
                title="Go to home"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-white/5">
                  <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    <BlurPopUpByWord text="jasmine" wordDelay={0.02} />
                  </span>
                  <span className="text-[10px] text-text-muted tracking-wider">
                    <BlurPopUpByWord text="ai" wordDelay={0.04} />
                  </span>
                </div>
              </button>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <button onClick={onStartDesigning} className={navCl('designer')}>
                build
              </button>
              <button onClick={onShowBlog} className={navCl('blog')}>
                blog
              </button>
              <button onClick={onShowDocs} className={navCl('docs')}>
                docs
              </button>
              {firebaseConfigured && (
                <button onClick={onShowNotifications} className={`${navCl('notifications')} relative`} title="Notifications">
                  notifications
                  {sharedProjectsCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-medium bg-jasmine-400 text-black rounded-full">
                      {sharedProjectsCount > 9 ? '9+' : sharedProjectsCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
          <button
              onClick={onStartDesigning}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title="Build"
            >
              <i className="ph ph-magic-wand text-lg"></i>
            </button>
          <button
              onClick={onShowBlog}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title="Blog"
            >
              <i className="ph ph-newspaper text-lg"></i>
            </button>
          <button
              onClick={onShowDocs}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title="Docs"
            >
              <i className="ph ph-book-open text-lg"></i>
            </button>
            {firebaseConfigured && (
              <button
                onClick={onShowNotifications}
                className="md:hidden relative p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                title="Notifications"
              >
                <i className="ph ph-bell text-lg"></i>
                {sharedProjectsCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 flex items-center justify-center text-[9px] font-medium bg-jasmine-400 text-black rounded-full">
                    {sharedProjectsCount > 9 ? '9+' : sharedProjectsCount}
                  </span>
                )}
              </button>
            )}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                title="Command palette (⌘K)"
              >
                <i className="ph ph-command text-lg"></i>
              </button>
            )}
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
        {marketingView ? (
          activePage === 'blog' ? (
            <BlogPage
              onStartDesigning={onStartDesigning}
              onBackHome={onShowHome}
              onOpenPost={onOpenPost}
              onBackToList={onBackToList}
              activeSlug={blogSlug}
              theme={theme}
            />
          ) : activePage === 'docs' ? (
            <DocsPage
              onStartDesigning={onStartDesigning}
              onBackHome={onShowHome}
              theme={theme}
            />
          ) : activePage === 'notifications' ? (
            <NotificationsPage
              theme={theme}
              user={user}
              sharedProjects={sharedProjects}
              loading={loadingSharedProjects}
              onLoadProject={onLoadProject}
              onBackHome={onShowHome}
              onStartDesigning={onStartDesigning}
              onRefresh={onRefreshSharedProjects}
            />
          ) : (
            <LandingPage
              onStartDesigning={onStartDesigning}
              onSelectPrompt={onSelectPrompt}
              onShowBlog={onShowBlog}
              theme={theme}
            />
          )
        ) : hasOutput ? (
          <Group orientation="horizontal" id="jasmine-split" className="flex-1 min-h-0 min-w-0" resizeTargetMinimumSize={{ fine: 32, coarse: 44 }}>
            <Panel defaultSize="50" minSize="35" maxSize="75" className="flex flex-col min-w-0 overflow-hidden">
            <div className={`flex flex-1 flex-col min-h-0 border-r ${borderCl}`}>
              <div className={`flex-1 flex flex-col min-w-0 ${hasOutput ? 'flex overflow-hidden' : 'flex items-center justify-center p-6 sm:p-8'}`}>
                {hasOutput ? (
                  <>
                    <div className={`flex-none px-4 py-3 border-b ${borderCl}`}>
                      <p className="text-xs text-text-muted tracking-wider">
                        <BlurPopUpByWord text="chat" wordDelay={0.02} />
                      </p>
                      <p className="text-sm text-text-secondary mt-0.5">
                        <BlurPopUpByWord text="ask to edit your design" wordDelay={0.03} />
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((m, i) => (
                        m.role === 'status' ? (
                          <StatusBubble
                            key={i}
                            message={m.message || m.content}
                            details={m.details}
                            icon={m.icon}
                            isLight={isLight}
                            detailLabel={m.detailLabel}
                          />
                        ) : (
                          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block max-w-[90%] px-3 py-2 rounded-xl ${m.role === 'user'
                              ? (isLight ? 'bg-[#379f57]/12 text-[#1f5c35] border border-[rgba(220,211,195,0.9)]' : 'bg-white/10 text-text-primary border border-white/[0.08]')
                              : (isLight ? 'bg-[#fffaf0] border border-[rgba(220,211,195,0.9)] text-text-secondary' : 'bg-white/[0.04] border border-white/[0.06] text-text-secondary')}`}>
                              {m.content}
                            </div>
                          </div>
                        )
                      ))}
                      {isEditing && (
                        <div className="text-left">
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${isLight ? 'bg-[#f6f4ec]' : 'bg-white/[0.04]'} text-text-muted text-sm`}>
                            <i className="ph ph-circle-notch animate-spin-slow"></i>
                            <span>Applying edit...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className={`flex-none p-4 border-t ${borderCl}`}>
                      <AttachedFilesSection
                        contextFiles={contextFiles}
                        setContextFiles={setContextFiles}
                        isLight={isLight}
                      />
                    <div className="flex gap-2 mt-2">
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2.5 rounded-xl border ${borderCl} ${isLight ? 'text-text-secondary hover:bg-[#f6f4ec]' : 'text-text-muted hover:bg-white/[0.04]'}`}
                      title="Attach files as context"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <i className="ph ph-paperclip"></i>
                    </motion.button>
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                        placeholder="Make the header darker..."
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm border ${borderCl} text-text-primary placeholder:text-text-muted focus:outline-none ${isLight ? 'bg-[#fffaf0]' : 'bg-white/[0.04]'}`}
                        disabled={isEditing}
                        onFocus={scrollChatToEnd}
                      />
                      <motion.button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isEditing}
                        className="btn-premium px-6 py-2.5 text-sm disabled:opacity-40"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <i className="ph ph-paper-plane-tilt"></i>
                      </motion.button>
                    </div>
                  </div>
                  </>
                ) : (
                  <div className="w-full max-w-2xl mx-auto">
                    <button
                      onClick={onShowHome}
                      className="text-sm text-text-muted hover:text-text-secondary mb-8"
                    >
                      ← back to overview
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] leading-[1.2] text-text-primary mb-4 text-center">
                      what will you design today?
                    </h1>
                    <p className="text-text-secondary text-center mb-4 text-base">
                      The World's Best Frontend Engineer
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
                    <div className="prompt-container overflow-hidden">
                    <AnimatePresence mode="wait">
                      {contextFiles.length > 0 && (
                        <motion.div
                          key="file-preview"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: EASE }}
                          className={`overflow-hidden border-b ${borderCl}`}
                        >
                          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
                            {contextFiles.map((f, i) => (
                              <FilePreviewChip
                                key={`${f.name}-${i}`}
                                f={f}
                                i={i}
                                onRemove={(idx) => setContextFiles((prev) => prev.filter((_, j) => j !== idx))}
                                isLight={isLight}
                                compact={false}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        <motion.button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-text-secondary hover:bg-[#f6f4ec]' : 'text-text-muted hover:bg-white/[0.06]'}`}
                          title="Attach files (jpg, png, webp, gif, pdf, docx, md, etc.)"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <i className="ph ph-paperclip text-base" />
                        </motion.button>
                        <span className="text-[11px] text-text-muted tracking-[0.02em] uppercase font-medium">
                          {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter
                        </span>
                      </div>
                      <motion.button
                        type="button"
                        onClick={firebaseConfigured && !user ? onSignInClick : generate}
                        disabled={isGenerating}
                        className="btn-premium flex items-center gap-2 px-8 py-3 text-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                        whileHover={!isGenerating ? { scale: 1.02 } : {}}
                        whileTap={!isGenerating ? { scale: 0.98 } : {}}
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
                      </motion.button>
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
                {githubUrl && (
                  <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-300 text-sm flex items-center justify-between gap-3">
                    <span>Pushed to GitHub</span>
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                      View repo <i className="ph ph-arrow-square-out text-base"></i>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRightTab('files')}
                      className={`flex items-center justify-center gap-2 min-w-[5.5rem] px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${rightTab === 'files' ? `text-text-primary ${isLight ? 'bg-neutral-200/80' : 'bg-surface-overlay'}` : `text-text-muted hover:text-text-secondary`}`}
                    >
                      <i className="ph ph-folder"></i>
                      Files
                    </button>
                    <button
                      onClick={() => setRightTab('preview')}
                      className={`flex items-center justify-center gap-2 min-w-[5.5rem] px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${rightTab === 'preview' ? `text-text-primary ${isLight ? 'bg-neutral-200/80' : 'bg-surface-overlay'}` : `text-text-muted hover:text-text-secondary`}`}
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

                <div className={`flex-1 relative min-h-0 overflow-hidden ${isLight ? 'bg-[#fffaf0]' : 'bg-surface-raised'}`}>

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
                      {getHtmlPreviewContent(generatedProject) ? (
                        <EditableHtmlPreview
                          project={generatedProject}
                          theme={theme}
                        />
                      ) : deployUrl ? (
                        <div className="flex-1 flex flex-col min-h-0">
                          <div className={`flex-none flex items-center justify-between px-3 py-2 border-b ${borderCl} gap-2`}>
                            <span className="text-xs text-text-muted">Live preview</span>
                  <div className="flex items-center gap-2">
                          <button
                                type="button"
                                onClick={() => setPreviewRetryKey((k) => k + 1)}
                                className="text-xs text-[#2d7f45] hover:text-[#1f5c35] flex items-center gap-1"
                              >
                                Retry <i className="ph ph-arrow-clockwise text-sm"></i>
                          </button>
                              <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2d7f45] hover:text-[#1f5c35] flex items-center gap-1">
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
                        </div>
                      ) : generatedProject?.files ? (
                        <div className="flex-1 flex items-center justify-center p-8">
                          <div className="text-center max-w-md">
                            <i className="ph ph-rocket-launch text-4xl text-jasmine-400 mb-4 block"></i>
                            <p className="text-text-primary font-semibold mb-2">Project generated</p>
                            <p className="text-sm text-text-muted mb-4">Switch to Files to view code. Use Download to run locally.</p>
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
                  onClick={onShowHome}
                  className="text-sm text-text-muted hover:text-text-secondary mb-8"
                >
                  ← back to overview
                        </button>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.02em] leading-[1.2] text-text-primary mb-4 text-center">
                  what will you design today?
                </h1>
                <p className="text-text-secondary text-center mb-4 text-base">
                  The World's Best Frontend Engineer
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
                <div className="prompt-container overflow-hidden">
                <AnimatePresence mode="wait">
                  {contextFiles.length > 0 && (
                    <motion.div
                      key="file-preview"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className={`overflow-hidden border-b ${borderCl}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
                        {contextFiles.map((f, i) => (
                          <FilePreviewChip
                            key={`${f.name}-${i}`}
                            f={f}
                            i={i}
                            onRemove={(idx) => setContextFiles((prev) => prev.filter((_, j) => j !== idx))}
                            isLight={isLight}
                            compact={false}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-text-secondary hover:bg-[#f6f4ec]' : 'text-text-muted hover:bg-white/[0.06]'}`}
                      title="Attach files (jpg, png, webp, gif, pdf, docx, md, etc.)"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="ph ph-paperclip text-base" />
                    </motion.button>
                    <span className="text-[11px] text-text-muted tracking-[0.02em] uppercase font-medium">
                      {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Enter
                    </span>
                  </div>
                  <motion.button
                    type="button"
                    onClick={firebaseConfigured && !user ? onSignInClick : generate}
                    disabled={isGenerating}
                    className="btn-premium flex items-center gap-2 px-8 py-3 text-[#0a0a0b] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none"
                    whileHover={!isGenerating ? { scale: 1.02 } : {}}
                    whileTap={!isGenerating ? { scale: 0.98 } : {}}
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
                  </motion.button>
                  </div>
                </div>
                        </div>
                        </div>
            {(deployUrl || netlifyUrl || githubUrl || error) && (
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
                {githubUrl && (
                  <div className="mx-4 sm:mx-6 mb-4 px-4 py-2.5 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-300 text-sm flex items-center justify-between gap-3">
                    <span>Pushed to GitHub</span>
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-1">
                      View repo <i className="ph ph-github-logo text-base"></i>
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
  const { user, loading: authLoading, signIn, signUp, signInWithGoogle, signOut, getIdToken, isConfigured: firebaseConfigured } = useAuth();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isRoot = pathname === '' || pathname === '/';
  const isWebsite = pathname.startsWith('/website');
  const [websiteUnlocked, setWebsiteUnlocked] = useState(() =>
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('website_unlocked') === '1'
  );
  const [prompt, setPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rightTab, setRightTab] = useState('files');
  const [chatMessages, setChatMessages] = useState([]);
  const [netlifyDeploying, setNetlifyDeploying] = useState(false);
  const [githubPushing, setGithubPushing] = useState(false);
  const [githubUrl, setGithubUrl] = useState(null);
  const [netlifyUrl, setNetlifyUrl] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const parseLocationToRoute = () => {
    if (typeof window === 'undefined') return { page: 'home', slug: null, sharedProjectId: null };
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    if (WAITLIST_ENABLED && parts[0] === 'website') parts.shift();
    if (parts[0] === 'blog') return { page: 'blog', slug: parts[1] || null, sharedProjectId: null };
    if (parts[0] === 'docs') return { page: 'docs', slug: null, sharedProjectId: null };
    if (parts[0] === 'notifications') return { page: 'notifications', slug: null, sharedProjectId: null };
    if (parts[0] === 'build' || parts[0] === 'designer') return { page: 'designer', slug: null, sharedProjectId: null };
    if (parts[0] === 'p' && parts[1]) return { page: 'shared', slug: null, sharedProjectId: parts[1] };
    return { page: 'home', slug: null, sharedProjectId: null };
  };
  const getInitialRoute = () => {
    if (typeof window === 'undefined') return { page: 'home', slug: null, sharedProjectId: null };
    const fromPath = parseLocationToRoute();
    if (fromPath.page === 'blog' || fromPath.page === 'docs' || fromPath.page === 'notifications' || fromPath.page === 'designer' || fromPath.slug || fromPath.sharedProjectId) return fromPath;
    const stored = localStorage.getItem('jasmine_active_page');
    return { page: stored === 'blog' || stored === 'docs' || stored === 'notifications' || stored === 'designer' ? stored : 'home', slug: null, sharedProjectId: null };
  };

  const [provider, setProvider] = useState(() => {
    const p = localStorage.getItem('jasmine_provider');
    if (p === 'groq' || p === 'ai-gateway') return 'gemini';
    if (p === 'openai' || p === 'gemini') return p;
    return p || 'gemini';
  });
  const [error, setError] = useState('');
  const [streamingRaw, setStreamingRaw] = useState('');
  const [activePage, setActivePage] = useState(() => getInitialRoute().page);
  const [blogSlug, setBlogSlug] = useState(() => getInitialRoute().slug);
  const [sharedProjectId, setSharedProjectId] = useState(() => getInitialRoute().sharedProjectId);
  const [showLanding, setShowLanding] = useState(() => activePage !== 'designer');
  const [theme, setTheme] = useState(() => localStorage.getItem('jasmine_theme') || 'light');
  const [generatedProject, setGeneratedProject] = useState(null);
  const [deployUrl, setDeployUrl] = useState(null);
  const [sandboxStarting, setSandboxStarting] = useState(false);
  const [sandboxRetryTrigger, setSandboxRetryTrigger] = useState(0);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const [contextFiles, setContextFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('jasmine_sidebar_open') !== 'false');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authClosing, setAuthClosing] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [sharedProjects, setSharedProjects] = useState([]);
  const [loadingSharedProjects, setLoadingSharedProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shareModalProject, setShareModalProject] = useState(null);
  const [modelHistory, setModelHistory] = useState([]);
  const saveTimeoutRef = useRef(null);

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  const scrollChatToEnd = useCallback(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('jasmine_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('jasmine_active_page', activePage);
  }, [activePage]);

  const prevGenEditRef = useRef({ isGenerating: false, isEditing: false });
  useEffect(() => {
    prevGenEditRef.current = { isGenerating, isEditing };
  }, [isGenerating, isEditing]);

  const handleThemeToggle = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('jasmine_provider', provider);
  }, [provider]);
  useEffect(() => {
    localStorage.setItem('jasmine_show_landing', String(showLanding));
  }, [showLanding]);

  const setPage = useCallback((page, options = {}) => {
    const slug = page === 'blog' ? (options.slug || null) : null;
    setActivePage(page);
    setShowLanding(page !== 'designer');
    setBlogSlug(slug);
    localStorage.setItem('jasmine_active_page', page);
    if (typeof window !== 'undefined') {
      const { search } = window.location;
      const base = WAITLIST_ENABLED ? '/website' : '';
      let path = base;
      if (page === 'blog') path = `${base}/blog${slug ? `/${slug}` : ''}`;
      else if (page === 'docs') path = `${base}/docs`;
      else if (page === 'notifications') path = `${base}/notifications`;
      else if (page === 'designer') path = `${base}/build`;
      path = path.replace(/^\/\//, '/') || '/';
      const url = `${path}${search}`;
      if (options.replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
  }, []);

  useEffect(() => {
    const handlePop = () => {
      const route = parseLocationToRoute();
      setActivePage(route.page);
      setShowLanding(route.page !== 'designer');
      setBlogSlug(route.slug || null);
      setSharedProjectId(route.sharedProjectId || null);
      localStorage.setItem('jasmine_active_page', route.page);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    if (WAITLIST_ENABLED && !isRoot && !isWebsite && pathname && !pathname.startsWith('/admin')) {
      window.location.replace('/');
    }
    if (!WAITLIST_ENABLED && pathname.startsWith('/website')) {
      const rest = pathname.replace(/^\/website/, '') || '/';
      window.location.replace(rest || '/');
    }
  }, [pathname, isRoot, isWebsite]);

  // Load shared project when user opens /p/:id — require auth first
  useEffect(() => {
    if (!sharedProjectId || !firebaseConfigured) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    loadProject({ id: sharedProjectId });
    setPage('designer');
    setSharedProjectId(null);
    window.history.replaceState(null, '', WAITLIST_ENABLED ? '/website/build' : '/build');
  }, [sharedProjectId, firebaseConfigured, user]);

  // Fetch projects when user logs in
  const refreshProjects = useCallback(() => {
    if (!firebaseConfigured || !user) return;
    setLoadingProjects(true);
    listProjects(user.uid)
      .then(setProjects)
        .catch((e) => {
        console.warn('[Jasmine] listProjects failed:', e?.message);
        setError(`Projects failed to load: ${e?.message || 'Unknown error'}. Ensure Firestore rules and indexes are deployed (\`firebase deploy --only firestore\`).`);
      })
      .finally(() => setLoadingProjects(false));
  }, [firebaseConfigured, user?.uid]);

  useEffect(() => {
    if (!firebaseConfigured || !user) {
      setProjects([]);
      return;
    }
    refreshProjects();
  }, [firebaseConfigured, user?.uid, refreshProjects]);

  const refreshSharedProjects = useCallback(() => {
    if (!firebaseConfigured || !user?.email) return;
    setLoadingSharedProjects(true);
    listSharedWithMe(user.email)
      .then(setSharedProjects)
      .catch(() => setSharedProjects([]))
      .finally(() => setLoadingSharedProjects(false));
  }, [firebaseConfigured, user?.email]);

  useEffect(() => {
    if (!firebaseConfigured || !user?.email) {
      setSharedProjects([]);
      return;
    }
    refreshSharedProjects();
  }, [firebaseConfigured, user?.email, refreshSharedProjects]);

  // Auto-open sidebar when user has projects (so they're visible)
  useEffect(() => {
    if (firebaseConfigured && user && projects.length > 0 && !loadingProjects) {
      setSidebarOpen((prev) => {
        if (!prev) {
          localStorage.setItem('jasmine_sidebar_open', 'true');
          return true;
        }
        return prev;
      });
    }
  }, [firebaseConfigured, user, projects.length, loadingProjects]);

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
        setError(`Save failed: ${e?.message || 'Unknown error'}. Check Firestore rules and indexes.`);
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
    let full;
    try {
      full = project.id ? await getProject(project.id) : project;
    } catch (e) {
      setError(e?.message || 'Failed to load project');
      return;
    }
    if (!full) return;
    setPrompt(full.prompt || '');
    setGeneratedProject(full.files ? { files: full.files } : null);
    setGeneratedHTML(full.html || '');
    setStreamingRaw('');
    setChatMessages(full.chatMessages?.length ? full.chatMessages : [{ role: 'user', content: full.prompt || '' }, { role: 'assistant', content: 'Loaded.' }]);
    setModelHistory([]);
    setProvider(full.provider === 'ai-gateway' || full.provider === 'groq' ? 'gemini' : (full.provider || 'gemini'));
    setCurrentProjectId(full.id);
    setPage('designer');
    setRightTab('files');
    setSidebarOpen(false);
    setError('');
    const hasFiles = full.files && Object.keys(full.files).length > 0 && !full._truncated;
    if (hasFiles) {
      setRightTab('files');
    } else if (full._truncated) {
      setError('Project was too large to save. Files were truncated. Try generating again with fewer/smaller files.');
    }
  }, [setPage, theme]);

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
        setPage('home');
      }
    } catch (e) {
      console.warn('[Jasmine] deleteProject failed:', e?.message);
    }
  }, [currentProjectId, firebaseConfigured, setPage, user]);

  const handleNewProject = useCallback(() => {
    setCurrentProjectId(null);
    setPrompt('');
    setGeneratedProject(null);
    setGeneratedHTML('');
    setStreamingRaw('');
    setChatMessages([]);
    setModelHistory([]);
    setPage('home');
    setSidebarOpen(false);
  }, [setPage]);

  const spinUpSandbox = useCallback(async () => {
    // Backend removed - no-op
  }, []);

  const sandboxStartedRef = useRef(false);

  const retrySandbox = () => {
    sandboxStartedRef.current = false;
    setError('');
    setSandboxRetryTrigger((t) => t + 1);
  };

  const retryPreviewUpdate = useCallback(async () => {
    // Backend removed - no-op
  }, []);


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

    setIsGenerating(true);
    setError('');
    setStreamingRaw('');
    setGeneratedHTML('');
    setGeneratedProject(null);
    setCurrentProjectId(null);
    setChatMessages([{ role: 'user', content: prompt }]);
    setModelHistory([{ role: 'user', content: prompt }]);
    setPage('designer');
    setRightTab('files');

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';

      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: JASMINE_SYSTEM_PROMPT,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';
      let currentMergedFiles = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const text = parsed.text;
            if (text) {
              full += text;
              setStreamingRaw(full);
              const currentFiles = parseFilesFromRaw(full);
              if (currentFiles.length > 0) {
                currentFiles.forEach((file) => {
                  const idx = currentMergedFiles.findIndex((f) => f.path === file.path);
                  if (idx !== -1) currentMergedFiles[idx] = file;
                  else currentMergedFiles.push(file);
                });
                setGeneratedProject({
                  files: Object.fromEntries(currentMergedFiles.map((file) => [file.path, file.content])),
                });
              }
            }
          } catch (_) {}
        }
      }

      const result = full;
      const parsedFiles = parseFilesFromRaw(result);
      const project = parsedFiles.length > 0
        ? { files: Object.fromEntries(parsedFiles.map((file) => [file.path, file.content])) }
        : extractNextProject(result);
      if (project?.files) {
        const replaced = {};
        for (const [path, content] of Object.entries(project.files)) {
          replaced[path] = await replaceImagePlaceholders(String(content));
        }
        project.files = replaced;
        setGeneratedProject(project);
      }
      setGeneratedHTML(result);
      if (project?.files) {
        applyPackageFixes(project.files);
        ensurePackageDependencies(project.files);
      }
      trackGeneration({ provider: 'gemini', fileCount: project?.files ? Object.keys(project.files).length : 0, hasContextFiles: contextFiles?.length > 0, hasSearchContext: 0 });
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'I\'ve generated your project. Ask me to edit it.' }]);
      setModelHistory((prev) => [...prev, { role: 'assistant', content: result }]);
      const commands = extractSlashCommands(result);
      if (commands.length > 0) {
        runSlashCommands(commands, {
          deployUrl,
          netlifyUrl,
          generatedProject: project,
          setChatMessages,
          setError,
          downloadProject: async () => {
            try {
              await downloadProjectAsZip(project, result);
            } catch (e) {
              setError(e?.message || 'Download failed');
            }
          },
        });
      }
      if (firebaseConfigured && user && project?.files) {
        const finalMessages = [...chatMessages, { role: 'assistant', content: 'I\'ve generated your project. Ask me to edit it.' }];
        try {
          await saveProject({ files: project.files, html: result, chatMessages: finalMessages });
          refreshProjects();
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
    setError('Deploy backend removed. Use /download to get your project.');
  };

  const pushToGitHub = async () => {
    setError('GitHub push backend removed. Use /download to get your project.');
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
    if (!msg || isEditing || isGenerating) return;
    const project = generatedProject || extractNextProject(streamingRaw || generatedHTML);
    if (!project?.files || Object.keys(project.files).length === 0) {
      setError('Generate a project first, then ask for edits.');
      return;
    }

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setModelHistory((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setError('');
    setIsEditing(true);
    setStreamingRaw('');

    const apiBase = import.meta.env.VITE_API_URL || '';
    const history = modelHistory.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    try {
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: msg,
          systemInstruction: JASMINE_SYSTEM_PROMPT,
          temperature: 0.7,
          history,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';
      let currentMergedFiles = Object.entries(project.files).map(([path, content]) => ({ path, content }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              full += parsed.text;
              setStreamingRaw(full);
              const currentFiles = parseFilesFromRaw(full);
              if (currentFiles.length > 0) {
                currentFiles.forEach((file) => {
                  const idx = currentMergedFiles.findIndex((f) => f.path === file.path);
                  if (idx !== -1) currentMergedFiles[idx] = file;
                  else currentMergedFiles.push(file);
                });
                setGeneratedProject({
                  files: Object.fromEntries(currentMergedFiles.map((file) => [file.path, file.content])),
                });
              }
            }
          } catch (_) {}
        }
      }

      const result = full;
      const merged = { ...project.files };
      const parsedFiles = parseFilesFromRaw(result);
      parsedFiles.forEach((file) => {
        merged[file.path] = file.content;
      });
      const finalProject = { files: merged };
      setGeneratedProject(finalProject);
      setGeneratedHTML(result);
      if (merged) {
        applyPackageFixes(merged);
        ensurePackageDependencies(merged);
      }
      const summary = "I've updated the project.";
      setChatMessages((prev) => [...prev, { role: 'assistant', content: summary }]);
      setModelHistory((prev) => [...prev, { role: 'assistant', content: result }]);
      trackEdit({ provider: 'gemini', fileCount: Object.keys(merged).length });
      if (firebaseConfigured && user && finalProject?.files) {
        const finalMessages = [...chatMessages, { role: 'user', content: msg }, { role: 'assistant', content: summary }];
        try {
          await saveProject({ files: finalProject.files, html: result, chatMessages: finalMessages });
          refreshProjects();
        } catch (_) {}
      }
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => prev.slice(0, -1));
      setModelHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsEditing(false);
    }
  };

  const hasOutput = generatedHTML || streamingRaw || isGenerating || (generatedProject?.files && Object.keys(generatedProject.files).length > 0);
  const isLight = theme === 'light';
  const base = 'bg-surface text-text-primary';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';
  const ghostCl = isLight ? 'bg-[#f6f4ec] hover:bg-[#e9dfcf] border-[rgba(220,211,195,0.9)] text-text-primary' : 'btn-ghost';
  const inputCl = isLight ? 'bg-[#fffaf0] border-[rgba(220,211,195,0.9)] focus:border-[#379f57]' : 'input-premium';

  const handleShowHome = useCallback(() => setPage('home'), [setPage]);
  const handleShowBlog = useCallback(() => setPage('blog', { slug: null }), [setPage]);
  const handleShowDocs = useCallback(() => setPage('docs'), [setPage]);
  const handleShowNotifications = useCallback(() => setPage('notifications'), [setPage]);
  const handleOpenBlogPost = useCallback((slug) => setPage('blog', { slug }), [setPage]);
  const handleBackToBlogList = useCallback(() => setPage('blog', { slug: null }), [setPage]);

  const goToDesigner = useCallback(() => {
    setPage('designer');
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [setPage]);

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

  const commandPaletteActions = useMemo(() => {
    const base = [
      { id: 'home', label: 'Go to home', icon: 'ph-house', keywords: ['home'], onSelect: handleShowHome },
      { id: 'build', label: 'Start designing', icon: 'ph-magic-wand', keywords: ['build', 'design', 'generate'], onSelect: handleStartDesigning },
      { id: 'blog', label: 'Open blog', icon: 'ph-newspaper', keywords: ['blog'], onSelect: handleShowBlog },
      { id: 'docs', label: 'Open docs', icon: 'ph-book-open', keywords: ['docs', 'documentation'], onSelect: handleShowDocs },
      { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, icon: theme === 'dark' ? 'ph-sun' : 'ph-moon', keywords: ['theme', 'dark', 'light'], onSelect: handleThemeToggle },
    ];
    if (firebaseConfigured && !user) {
      base.push({ id: 'signin', label: 'Sign in', icon: 'ph-sign-in', keywords: ['sign', 'login'], onSelect: () => setShowAuthModal(true) });
    }
    if (firebaseConfigured && user) {
      base.push({ id: 'projects', label: 'Open projects', icon: 'ph-folder', keywords: ['projects', 'sidebar'], onSelect: () => setSidebarOpen(true) });
    }
    if (activePage === 'designer' && prompt?.trim()) {
      base.push({ id: 'generate', label: 'Generate', icon: 'ph-sparkle', shortcut: '⌘↵', keywords: ['generate'], onSelect: generate });
    }
    const hasProject = generatedProject?.files && Object.keys(generatedProject.files).length > 0;
    if (hasProject) {
      base.push({ id: 'download', label: 'Download project', icon: 'ph-download-simple', keywords: ['download', 'zip'], onSelect: downloadProject });
      base.push({ id: 'deploy', label: 'Deploy to Netlify', icon: 'ph-rocket-launch', keywords: ['deploy', 'netlify'], onSelect: deployToNetlify, disabled: netlifyDeploying });
    }
    if (activePage === 'designer') {
      base.push({ id: 'new', label: 'New project', icon: 'ph-plus', keywords: ['new'], onSelect: handleNewProject });
    }
    return base.filter((a) => !a.disabled);
  }, [
    theme,
    activePage,
    prompt,
    generatedProject,
    firebaseConfigured,
    user,
    netlifyDeploying,
    handleShowHome,
    handleShowBlog,
    handleStartDesigning,
    handleThemeToggle,
    handleNewProject,
    generate,
    downloadProject,
    deployToNetlify,
  ]);

  const appBodyProps = {
    theme,
    activePage,
    onShowHome: handleShowHome,
    onShowBlog: handleShowBlog,
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
    scrollChatToEnd,
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
    githubUrl,
    themeForToggle: theme,
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    retrySandbox,
    retryPreviewUpdate,
    sidebarOpen,
    onToggleSidebar: () =>
      setSidebarOpen((o) => {
        const next = !o;
        localStorage.setItem('jasmine_sidebar_open', String(next));
        return next;
      }),
    user,
    onSignInClick: () => setShowAuthModal(true),
    onSignOut: signOut,
    firebaseConfigured,
  onStartDesigning: handleStartDesigning,
    onSelectPrompt: handleSelectPrompt,
  onOpenPost: handleOpenBlogPost,
  onBackToList: handleBackToBlogList,
  onShowDocs: handleShowDocs,
  onShowNotifications: handleShowNotifications,
  onLoadProject: loadProject,
  onRefreshSharedProjects: refreshSharedProjects,
  sharedProjects,
  loadingSharedProjects,
  sharedProjectsCount: sharedProjects?.length ?? 0,
    blogSlug,
  };

  if (WAITLIST_ENABLED && isRoot) {
    return <WaitlistPage />;
  }
  if (WAITLIST_ENABLED && isWebsite && !websiteUnlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('website_unlocked', '1');
          }
          setWebsiteUnlocked(true);
        }}
      />
    );
  }
  if (WAITLIST_ENABLED && !isWebsite && !isRoot) {
    return null;
  }

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
            onClose={() => {
              setSidebarOpen(false);
              localStorage.setItem('jasmine_sidebar_open', 'false');
            }}
            onToggle={() => {
              setSidebarOpen(false);
              localStorage.setItem('jasmine_sidebar_open', 'false');
            }}
            user={user}
            projects={projects}
            onLoadProject={loadProject}
            onDeleteProject={handleDeleteProject}
            onNewProject={handleNewProject}
            onShareProject={(p) => setShareModalProject(p)}
            onSpinUpSandbox={spinUpSandbox}
            onRefresh={refreshProjects}
            loadingProjects={loadingProjects}
            theme={theme}
          />
        )}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <AppBody {...appBodyProps} onThemeToggle={handleThemeToggle} />
      </div>
      </div>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        actions={commandPaletteActions}
        theme={theme}
      />
      {shareModalProject && (
        <ShareModal
          project={shareModalProject}
          onClose={() => setShareModalProject(null)}
          onSuccess={() => refreshProjects()}
          theme={theme}
          getIdToken={getIdToken}
        />
      )}
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
