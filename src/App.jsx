import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { generateWithGroq, generateWithGemini, generateWithGateway, generateWithOpenAI, editWithGroq, editWithGemini, editWithGateway, editWithOpenAI, extractNextProject, extractEditSummary, extractSlashCommands, replaceImagePlaceholders, fixProjectErrors, ensurePackageDependencies, applyPackageFixes, webSearch, decideSearchQuery, getHtmlPreviewContent, projectToRaw, GROQ_MODEL_KIMI } from './api';
import { HTML_SYSTEM_PROMPT, HTML_EDIT_SYSTEM_PROMPT } from './systemPrompt.js';
import { downloadProjectAsZip } from './downloadZip';
import LandingPage from './pages/LandingPage';
import BlogPage from './pages/BlogPage';
import DocsPage from './pages/DocsPage';
import WaitlistPage from './pages/WaitlistPage';
import PasswordGate from './components/PasswordGate';
import FileExplorer from './FileExplorer';
import BlurPopUpByWord from './components/BlurPopUpByWord';
import AuthPage from './components/AuthPage';
import E2BBadge from './components/E2BBadge';
import StatusBubble from './components/StatusBubble';
import ProjectSidebar from './components/ProjectSidebar';
import CommandPalette from './components/CommandPalette';
import EditableHtmlPreview from './components/EditableHtmlPreview';
import ShareModal from './components/ShareModal';
import { useAuth } from './contexts/AuthContext';
import { createProject, updateProject, listProjects, getProject, deleteProject } from './lib/projects';
import { trackGeneration, trackEdit, trackDeploy } from './lib/analytics';
import { fetchApiCompressed } from './lib/compress-api';

const EASE = [0.22, 1, 0.36, 1];

/** Set to true to show waitlist on / and password gate on /website. Set to false to go straight to the website. */
const WAITLIST_ENABLED = false;

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

function HtmlModeToggle({ htmlMode, setHtmlMode, isLight, disabled }) {
  const trackCl = isLight ? 'bg-neutral-200' : 'bg-white/10';
  const thumbCl = isLight ? 'bg-white shadow-sm' : 'bg-neutral-700';
  const activeTextCl = isLight ? 'text-neutral-900' : 'text-white';
  const inactiveTextCl = 'text-text-muted';

  return (
    <div className={`relative flex rounded-full p-0.5 ${trackCl} h-8 min-w-[11rem] shrink-0 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <motion.div
        className={`absolute left-0.5 top-0.5 bottom-0.5 w-[calc(50%-4px)] rounded-full ${thumbCl}`}
        animate={{ x: htmlMode ? 'calc(100% + 4px)' : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <button
        type="button"
        onClick={() => setHtmlMode(false)}
        disabled={disabled}
        className={`relative z-10 flex-1 min-w-0 px-3 py-1.5 text-xs font-medium h-full flex items-center justify-center rounded-full transition-colors whitespace-nowrap leading-none ${!htmlMode ? activeTextCl : inactiveTextCl}`}
        title="Vite + React — full project"
      >
        Vite + React
      </button>
      <button
        type="button"
        onClick={() => setHtmlMode(true)}
        disabled={disabled}
        className={`relative z-10 flex-1 min-w-0 px-3 py-1.5 text-xs font-medium h-full flex items-center justify-center rounded-full transition-colors whitespace-nowrap leading-none ${htmlMode ? activeTextCl : inactiveTextCl}`}
        title="HTML — single file, instant"
      >
        HTML
      </button>
    </div>
  );
}

function ModelSelectDropdown({ provider, setProvider, gatewayModel, setGatewayModel, isLight, borderCl }) {
  const selectCl = isLight
    ? 'bg-[#fffaf0] text-text-primary border-[rgba(220,211,195,0.9)] hover:bg-[#f6f4ec]'
    : 'bg-white/[0.06] text-text-primary border-white/[0.08] hover:bg-white/[0.08]';

  const displayValue = provider === 'gemini' ? 'gemini' : provider === 'openai' ? 'gpt-5.4' : gatewayModel;

  return (
    <select
      value={displayValue}
      onChange={(e) => {
        const v = e.target.value;
        if (v === 'gemini') {
          setProvider('gemini');
        } else if (v === 'gpt-5.4') {
          setProvider('openai');
          setGatewayModel('gpt-5.4');
        } else if (v === 'gemini-3-flash') {
          setProvider('ai-gateway');
          setGatewayModel('gemini-3-flash');
        } else {
          setProvider('ai-gateway');
          setGatewayModel(v);
        }
      }}
      className={`h-7 min-w-[6.5rem] text-xs font-medium rounded-lg pl-2.5 pr-7 border cursor-pointer appearance-none bg-no-repeat bg-[length:10px] bg-[right_0.4rem_center] ${borderCl} ${selectCl}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
    >
      <option value="gemini">Gemini (direct)</option>
      <option value="gemini-3-flash">Gemini 3 Flash (gateway)</option>
      <option value="kimi-k2.5">Kimi K2.5</option>
      <option value="gpt-5.4">GPT 5.4</option>
    </select>
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
  const { apiBase, sandboxId, deployUrl, netlifyUrl, generatedProject, setDeployUrl, setSandboxId, setSandboxStarting, setChatMessages, setError, setRightTab, setPreviewRetryKey, applyPackageFixes, ensurePackageDependencies, downloadProject, fixProjectErrors, provider, groqKey, geminiKey, gatewayModel, setGeneratedProject, setNetlifyUrl, retryPreviewUpdate } = ctx;
  for (const { cmd, arg } of commands) {
    try {
      if (cmd === 'sandbox-state') {
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: sandboxId ? `Preview: ${deployUrl || 'loading...'} (sandbox: ${sandboxId})` : 'No sandbox running',
          details: sandboxId ? [deployUrl] : [],
          icon: 'ph-browser',
        }]);
      } else if (cmd === 'create') {
        setSandboxStarting(true);
        const res = await fetch(`${apiBase}/api/sandbox/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: 'dark' }),
        });
        const data = await parseJsonResponse(res);
        if (data.success && data.sandboxId && data.url) {
          setDeployUrl(data.url);
          setSandboxId(data.sandboxId);
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Sandbox created', details: [data.url], icon: 'ph-rocket-launch' }]);
          setRightTab('preview');
        } else {
          setError(data?.error || 'Sandbox start failed');
        }
        setSandboxStarting(false);
      } else if (cmd === 'apply' && sandboxId && generatedProject?.files) {
        const files = { ...generatedProject.files };
        applyPackageFixes(files);
        ensurePackageDependencies(files);
        const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId, files });
        if (res.ok) {
          setPreviewRetryKey((k) => k + 1);
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Applied to preview', details: [`${Object.keys(files).length} files`], icon: 'ph-upload-simple' }]);
          setRightTab('preview');
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data?.error || 'Apply failed');
        }
      } else if (cmd === 'deploy' && generatedProject?.files) {
        const files = { ...generatedProject.files };
        applyPackageFixes(files);
        ensurePackageDependencies(files);
        const res = await fetchApiCompressed(`${apiBase}/api/deploy`, { files });
        const data = await parseJsonResponse(res);
        if (data.success && data.url) {
          setDeployUrl(data.url);
          if (data.sandboxId) setSandboxId(data.sandboxId);
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Deployed', details: [data.url], icon: 'ph-rocket-launch' }]);
          setRightTab('preview');
        } else {
          setError(data?.error || 'Deploy failed');
        }
      } else if (cmd === 'web-search' && arg) {
        const results = await webSearch(arg, apiBase);
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: `Web search: ${arg}`,
          details: results?.slice(0, 5).map((r) => r.title || r.link) || [],
          icon: 'ph-magnifying-glass',
        }]);
      } else if (cmd === 'download' && downloadProject) {
        await downloadProject();
        setChatMessages((prev) => [...prev, { role: 'status', message: 'Download started', details: [], icon: 'ph-download-simple' }]);
      } else if (cmd === 'fix-errors' && fixProjectErrors && generatedProject?.files && setGeneratedProject) {
        setChatMessages((prev) => [...prev, { role: 'status', message: 'Fixing errors...', details: [], icon: 'ph-wrench' }]);
        const fixed = await fixProjectErrors(generatedProject, provider, groqKey, geminiKey, apiBase, gatewayModel);
        if (fixed) {
          setGeneratedProject({ files: fixed });
          ctx.generatedProject = { files: fixed };
          const filesToApply = { ...fixed };
          applyPackageFixes(filesToApply);
          ensurePackageDependencies(filesToApply);
          if (sandboxId) {
            let applied = false;
            for (let attempt = 0; attempt < 3 && !applied; attempt++) {
              try {
                const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId, files: filesToApply });
                if (res.ok) {
                  applied = true;
                  setPreviewRetryKey((k) => k + 1);
                  setRightTab('preview');
                  setChatMessages((prev) => [...prev, { role: 'status', message: 'Errors fixed and applied to preview', details: [`${Object.keys(fixed).length} files`], icon: 'ph-check-circle' }]);
                } else if ((res.status === 504 || res.status === 413) && attempt < 2) {
                  await new Promise((r) => setTimeout(r, 3000));
                } else {
                  const data = await res.json().catch(() => ({}));
                  setError(data?.error || 'Apply to preview failed. Click Retry.');
                  setChatMessages((prev) => [...prev, { role: 'status', message: 'Errors fixed', details: [`${Object.keys(fixed).length} files updated`], icon: 'ph-check-circle' }]);
                  break;
                }
              } catch (e) {
                if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
                else {
                  setError(e?.message || 'Apply to preview failed. Click Retry.');
                  setChatMessages((prev) => [...prev, { role: 'status', message: 'Errors fixed', details: [`${Object.keys(fixed).length} files updated`], icon: 'ph-check-circle' }]);
                }
              }
            }
          } else {
            setChatMessages((prev) => [...prev, { role: 'status', message: 'Errors fixed', details: [`${Object.keys(fixed).length} files updated`], icon: 'ph-check-circle' }]);
          }
        } else {
          setChatMessages((prev) => [...prev, { role: 'status', message: 'No changes needed', details: [], icon: 'ph-check' }]);
        }
      } else if (cmd === 'netlify-deploy' && generatedProject?.files) {
        const files = { ...generatedProject.files };
        applyPackageFixes(files);
        ensurePackageDependencies(files);
        const res = await fetchApiCompressed(`${apiBase}/api/deploy`, { target: 'netlify', sandboxId, files });
        const data = await parseJsonResponse(res);
        if (data.success && data.url) {
          setNetlifyUrl?.(data.url);
          trackDeploy({ platform: 'netlify' });
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Deployed to Netlify', details: [data.url], icon: 'ph-rocket-launch' }]);
          setRightTab('preview');
        } else {
          setError(data?.error || 'Netlify deploy failed');
        }
      } else if (cmd === 'generate-image' && arg) {
        const res = await fetch(`${apiBase}/api/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: arg }),
        });
        const data = await parseJsonResponse(res);
        if (data.image) {
          setChatMessages((prev) => [...prev, {
            role: 'status',
            message: `Generated image: ${arg.slice(0, 40)}...`,
            details: [data.image],
            icon: 'ph-image',
          }]);
        } else {
          setError(data?.error || 'Image generation failed');
        }
      } else if (cmd === 'open-preview') {
        const url = deployUrl || netlifyUrl;
        if (url) {
          window.open(url, '_blank', 'noopener');
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Opened preview in new tab', details: [url], icon: 'ph-browser' }]);
        } else {
          setChatMessages((prev) => [...prev, { role: 'status', message: 'No preview URL yet. Deploy or create a sandbox first.', details: [], icon: 'ph-warning' }]);
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
          setChatMessages((prev) => [...prev, { role: 'status', message: 'No preview URL yet. Deploy or create a sandbox first.', details: [], icon: 'ph-warning' }]);
        }
      } else if (cmd === 'list-files' && generatedProject?.files) {
        const paths = Object.keys(generatedProject.files).sort();
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: `${paths.length} files`,
          details: paths,
          icon: 'ph-file-code',
        }]);
      } else if (cmd === 'retry' && retryPreviewUpdate) {
        await retryPreviewUpdate();
        setChatMessages((prev) => [...prev, { role: 'status', message: 'Retrying preview', details: [], icon: 'ph-arrow-clockwise' }]);
        setRightTab('preview');
      } else if (cmd === 'health') {
        const res = await fetch(`${apiBase}/api/health`);
        const data = await res.json().catch(() => ({}));
        const ok = data.e2bConfigured !== false;
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: ok ? 'API healthy' : 'API issue',
          details: data.e2bError ? [data.e2bError] : [data.e2bConfigured ? 'E2B configured' : 'E2B not configured'],
          icon: ok ? 'ph-check-circle' : 'ph-warning',
        }]);
      } else if (cmd === 'help') {
        const cmds = ['/sandbox-state', '/deploy', '/create', '/apply', '/create-and-apply', '/web-search <query>', '/download', '/fix-errors', '/netlify-deploy', '/generate-image <prompt>', '/retry', '/open-preview', '/copy-url', '/list-files', '/health', '/help'];
        setChatMessages((prev) => [...prev, {
          role: 'status',
          message: 'Available commands',
          details: cmds,
          icon: 'ph-list',
        }]);
      } else if (cmd === 'create-and-apply' && generatedProject?.files) {
        const sid = sandboxId;
        if (sid) {
          const files = { ...generatedProject.files };
          applyPackageFixes(files);
          ensurePackageDependencies(files);
          const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId: sid, files });
          if (res.ok) {
            setPreviewRetryKey((k) => k + 1);
            setChatMessages((prev) => [...prev, { role: 'status', message: 'Applied to preview', details: [`${Object.keys(files).length} files`], icon: 'ph-upload-simple' }]);
            setRightTab('preview');
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data?.error || 'Apply failed');
          }
        } else {
          setSandboxStarting(true);
          const startRes = await fetch(`${apiBase}/api/sandbox/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: 'dark' }),
          });
          const startData = await parseJsonResponse(startRes);
          if (startData.success && startData.sandboxId && startData.url) {
            setDeployUrl(startData.url);
            setSandboxId(startData.sandboxId);
            const files = { ...generatedProject.files };
            applyPackageFixes(files);
            ensurePackageDependencies(files);
            const updRes = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId: startData.sandboxId, files });
            if (updRes.ok) {
              setPreviewRetryKey((k) => k + 1);
              setChatMessages((prev) => [...prev, { role: 'status', message: 'Sandbox created and applied', details: [startData.url, `${Object.keys(files).length} files`], icon: 'ph-rocket-launch' }]);
              setRightTab('preview');
            } else {
              const updData = await updRes.json().catch(() => ({}));
              setError(updData?.error || 'Apply failed');
            }
          } else {
            setError(startData?.error || 'Sandbox start failed');
          }
          setSandboxStarting(false);
        }
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
  provider,
  setProvider,
  gatewayModel,
  setGatewayModel,
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
  htmlMode,
  setHtmlMode,
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
  blogSlug,
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
                      the world's best designer. one prompt.
                    </p>
                    {(deployUrl || sandboxStarting) && !htmlMode && (
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
                        <ModelSelectDropdown
                          provider={provider}
                          setProvider={setProvider}
                          gatewayModel={gatewayModel}
                          setGatewayModel={setGatewayModel}
                          isLight={isLight}
                          borderCl={borderCl}
                        />
                        <HtmlModeToggle htmlMode={htmlMode} setHtmlMode={setHtmlMode} isLight={isLight} disabled={isGenerating || isEditing} />
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
                    <HtmlModeToggle htmlMode={htmlMode} setHtmlMode={setHtmlMode} isLight={isLight} disabled={isGenerating || isEditing} />
                    {deployUrl && !htmlMode && (
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
                      {htmlMode && getHtmlPreviewContent(generatedProject) ? (
                        <EditableHtmlPreview
                          html={getHtmlPreviewContent(generatedProject)}
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
                      ) : generatedProject?.files && !htmlMode ? (
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
                  onClick={onShowHome}
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
                {(deployUrl || sandboxStarting) && !htmlMode && (
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
                    <HtmlModeToggle htmlMode={htmlMode} setHtmlMode={setHtmlMode} isLight={isLight} disabled={isGenerating || isEditing} />
                    <ModelSelectDropdown
                      provider={provider}
                      setProvider={setProvider}
                      gatewayModel={gatewayModel}
                      setGatewayModel={setGatewayModel}
                      isLight={isLight}
                      borderCl={borderCl}
                    />
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
    if (parts[0] === 'build' || parts[0] === 'designer') return { page: 'designer', slug: null, sharedProjectId: null };
    if (parts[0] === 'p' && parts[1]) return { page: 'shared', slug: null, sharedProjectId: parts[1] };
    return { page: 'home', slug: null, sharedProjectId: null };
  };
  const getInitialRoute = () => {
    if (typeof window === 'undefined') return { page: 'home', slug: null, sharedProjectId: null };
    const fromPath = parseLocationToRoute();
    if (fromPath.page === 'blog' || fromPath.page === 'docs' || fromPath.page === 'designer' || fromPath.slug || fromPath.sharedProjectId) return fromPath;
    const stored = localStorage.getItem('jasmine_active_page');
    return { page: stored === 'blog' || stored === 'docs' || stored === 'designer' ? stored : 'home', slug: null, sharedProjectId: null };
  };

  const [provider, setProvider] = useState(() => {
    const p = localStorage.getItem('jasmine_provider');
    if (p === 'groq') return 'gemini';
    if (p === 'openai' || p === 'gemini' || p === 'ai-gateway') return p;
    return p || 'gemini';
  });
  const [gatewayModel, setGatewayModel] = useState(() => {
    const p = localStorage.getItem('jasmine_provider');
    const m = localStorage.getItem('jasmine_gateway_model');
    if (p === 'groq') return 'gemini-3-flash';
    return m || 'gemini-3-flash';
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
  const [sandboxId, setSandboxId] = useState(null);
  const [sandboxStarting, setSandboxStarting] = useState(false);
  const [sandboxRetryTrigger, setSandboxRetryTrigger] = useState(0);
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const sandboxIdRef = useRef(null);
  const pendingSandboxApplyRef = useRef(null);
  const [contextFiles, setContextFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('jasmine_sidebar_open') !== 'false');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authClosing, setAuthClosing] = useState(false);
  const [pendingAfterAuth, setPendingAfterAuth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [e2bBadgeDismissed, setE2bBadgeDismissed] = useState(false);
  const [htmlMode, setHtmlMode] = useState(() => localStorage.getItem('jasmine_html_mode') === 'true');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shareModalProject, setShareModalProject] = useState(null);
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

  useEffect(() => {
    localStorage.setItem('jasmine_html_mode', String(htmlMode));
  }, [htmlMode]);

  useEffect(() => {
    sandboxIdRef.current = sandboxId;
    if (sandboxId && pendingSandboxApplyRef.current) {
      const files = pendingSandboxApplyRef.current;
      pendingSandboxApplyRef.current = null;
      const fixed = { ...files };
      applyPackageFixes(fixed);
      ensurePackageDependencies(fixed);
      (async () => {
        const apiBase = import.meta.env.VITE_API_URL || '';
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log('[Jasmine] POST /api/sandbox/update (pending apply)', Object.keys(fixed).length, 'files', attempt ? `retry ${attempt}` : '');
            const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId, files: fixed });
            if (res.ok) {
              console.log('[Jasmine] sandbox/update (pending apply) ok');
              setPreviewRetryKey((k) => k + 1);
              setChatMessages((prev) => [...prev, { role: 'status', message: 'Project applied to preview', details: [`${Object.keys(fixed).length} files`], icon: 'ph-upload-simple' }]);
              return;
            }
            if (res.status === 504 || res.status === 413) {
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }
            const data = await res.json().catch(() => ({}));
            setError(data?.error || `Apply failed (${res.status})`);
            return;
          } catch (e) {
            console.warn('[Jasmine] sandbox update (pending apply) failed:', e?.message);
            if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
            else setError(e?.message || 'Apply failed');
          }
        }
      })();
    }
  }, [sandboxId]);

  const prevGenEditRef = useRef({ isGenerating: false, isEditing: false });
  useEffect(() => {
    const wasGen = prevGenEditRef.current.isGenerating;
    const wasEdit = prevGenEditRef.current.isEditing;
    prevGenEditRef.current = { isGenerating, isEditing };
    const justFinished = (wasGen && !isGenerating) || (wasEdit && !isEditing);
    if (justFinished && !htmlMode && sandboxId && generatedProject?.files && Object.keys(generatedProject.files).length > 0) {
      const files = { ...generatedProject.files };
      applyPackageFixes(files);
      ensurePackageDependencies(files);
      (async () => {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '';
          console.log('[Jasmine] POST /api/sandbox/update (post-gen/edit, files-tab source)', Object.keys(files).length, 'files');
          const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId, files });
          if (res.ok) setPreviewRetryKey((k) => k + 1);
          else console.warn('[Jasmine] sandbox/update (post-gen/edit)', res.status);
        } catch (e) {
          console.warn('[Jasmine] sandbox update (post-gen/edit) failed:', e?.message);
        }
      })();
    }
  }, [isGenerating, isEditing, htmlMode, sandboxId, generatedProject]);

  const handleThemeToggle = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('jasmine_provider', provider);
  }, [provider]);
  useEffect(() => {
    localStorage.setItem('jasmine_gateway_model', gatewayModel);
  }, [gatewayModel]);

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
        gatewayModel: data.gatewayModel ?? gatewayModel,
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
    [firebaseConfigured, user, currentProjectId, prompt, generatedProject, generatedHTML, chatMessages, provider, gatewayModel]
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
    setProvider(full.provider || 'gemini');
    setGatewayModel(full.gatewayModel || 'gemini-3-flash');
    setCurrentProjectId(full.id);
    setPage('designer');
    setRightTab('files');
    setSidebarOpen(false);
    setError('');
    const hasFiles = full.files && Object.keys(full.files).length > 0 && !full._truncated;
    const isHtmlProject = hasFiles && (full.files['index.html'] || full.files['index.htm']) && !full.files['package.json'];
    if (hasFiles) {
      if (isHtmlProject) {
        setHtmlMode(true);
        setRightTab('preview');
      } else {
        pendingSandboxApplyRef.current = full.files;
        setSandboxStarting(true);
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
            setRightTab('preview');
          } else {
            setError(data?.error || 'Sandbox start failed');
          }
        } catch (e) {
          setError(e?.message || 'Sandbox failed');
        } finally {
          setSandboxStarting(false);
        }
      }
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
    setPage('home');
    setSidebarOpen(false);
  }, [setPage]);

  const spinUpSandbox = useCallback(async (project) => {
    let files = project.files;
    if (!files || Object.keys(files).length === 0) return;
    const isHtmlProject = (files['index.html'] || files['index.htm']) && !files['package.json'];
    if (isHtmlProject) return;
    files = { ...files };
    applyPackageFixes(files);
    ensurePackageDependencies(files);
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
        for (let attempt = 0; attempt < 3; attempt++) {
          const updRes = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId: data.sandboxId, files });
          if (updRes.ok) {
            setPreviewRetryKey((k) => k + 1);
            setRightTab('preview');
            break;
          }
          if ((updRes.status === 504 || updRes.status === 413) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          const errData = await updRes.json().catch(() => ({}));
          setError(errData?.error || `Apply failed (${updRes.status})`);
          break;
        }
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
    applyPackageFixes(files);
    ensurePackageDependencies(files);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId: sid, files });
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
    if (localStorage.getItem('jasmine_html_mode') === 'true') return;
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

    const useGroq = provider === 'ai-gateway' && gatewayModel === 'kimi-k2.5';
    const key = useGroq
      ? import.meta.env.VITE_GROQ_API_KEY
      : provider === 'openai'
        ? import.meta.env.VITE_OPENAI_API_KEY
        : provider === 'ai-gateway'
          ? ''
          : import.meta.env.VITE_GEMINI_API_KEY;
    if (!useGroq && provider !== 'ai-gateway' && !key) {
      const keyName = provider === 'openai' ? 'OPENAI' : 'GEMINI';
      setError(`Add VITE_${keyName}_API_KEY to your .env file`);
      return;
    }
    if (useGroq && !key) {
      setError('Add VITE_GROQ_API_KEY for Kimi');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStreamingRaw('');
    setGeneratedHTML('');
    setGeneratedProject(null);
    setCurrentProjectId(null);
    setChatMessages([{ role: 'user', content: prompt }]);
    setPage('designer');
    setRightTab('files');

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      let currentSandboxId = sandboxId;
      let currentDeployUrl = deployUrl;

      if (!currentSandboxId && sandboxStarting) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (sandboxIdRef.current) {
            currentSandboxId = sandboxIdRef.current;
            break;
          }
        }
      }
      if (!htmlMode && !currentSandboxId && !sandboxStarting) {
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
            currentDeployUrl = startData.url;
            currentSandboxId = startData.sandboxId;
            setDeployUrl(startData.url);
            setSandboxId(currentSandboxId);
          }
        } catch (e) {
          console.warn('[Jasmine] sandbox start skipped:', e?.message);
        }
      }

      // Only send sandbox update when generation completes (final update below).
      // Streaming updates caused 20+ rebuilds per project, 504 timeouts, and port errors.
      const onChunk = (chunk) => setStreamingRaw(chunk);

      let searchContext = [];
      const decideProvider = useGroq ? 'groq' : provider;
      const searchQuery = await decideSearchQuery(prompt, decideProvider, key, apiBase, gatewayModel);
      if (searchQuery) {
        try {
          searchContext = await webSearch(searchQuery, apiBase);
          if (searchContext?.length > 0) {
            setChatMessages((prev) => [...prev, { role: 'status', message: 'Searching web for context', details: [searchQuery], icon: 'ph-magnifying-glass', detailLabel: 'query' }]);
          }
        } catch (e) {
          console.warn('[Jasmine] AI-requested search failed:', e?.message);
        }
      }

      const sysPrompt = htmlMode ? HTML_SYSTEM_PROMPT : undefined;
      const groqModel = GROQ_MODEL_KIMI;
      const generateFn =
        provider === 'gemini'
          ? (k, p, onC, cf, sc) => generateWithGemini(k, p, onC, cf, sc, sysPrompt)
          : useGroq
            ? (k, p, onC, cf, sc) => generateWithGroq(k, p, onC, cf, sc, sysPrompt, groqModel)
            : provider === 'ai-gateway'
              ? (_, p, onC, cf, sc) => generateWithGateway(apiBase, gatewayModel, p, onC, cf, sc, sysPrompt)
              : provider === 'openai'
                ? (k, p, onC, cf, sc) => generateWithOpenAI(k, p, onC, cf, sc, sysPrompt)
                : (k, p, onC, cf, sc) => generateWithGemini(k, p, onC, cf, sc, sysPrompt);
      const genKey = (useGroq || provider === 'openai' || provider === 'gemini') ? key : '';
      let result = await generateFn(genKey, prompt, onChunk, contextFiles, searchContext);

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

      // Post-generation: fix errors (React only; HTML skip)
      if (project?.files && !htmlMode) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const fixedFiles = await fixProjectErrors(project, provider, groqKey, geminiKey, apiBase, gatewayModel);
        if (fixedFiles && Object.keys(fixedFiles).length > 0) {
          project.files = fixedFiles;
          setGeneratedProject({ ...project, files: fixedFiles });
        }
        applyPackageFixes(project.files);
        ensurePackageDependencies(project.files);
      }

      const filesToApply = project?.files || {};
      if (Object.keys(filesToApply).length > 0 && !htmlMode) {
        if (currentSandboxId) {
          const deps = (() => {
            try {
              const pkg = JSON.parse(filesToApply['package.json'] || '{}');
              return Object.keys(pkg.dependencies || {});
            } catch { return []; }
          })();
          if (deps.length > 0) {
            setChatMessages((prev) => [...prev, { role: 'status', message: 'Installing dependencies', details: deps, icon: 'ph-package', detailLabel: 'packages' }]);
          }
          setChatMessages((prev) => [...prev, { role: 'status', message: 'Applying to preview', details: [`${Object.keys(filesToApply).length} files`], icon: 'ph-upload-simple', detailLabel: 'files' }]);
          let updated = false;
          for (let attempt = 0; attempt < 3 && !updated; attempt++) {
            try {
              const updRes = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId: currentSandboxId, files: filesToApply });
              if (updRes.ok) {
                updated = true;
                setPreviewRetryKey((k) => k + 1);
              } else if ((updRes.status === 504 || updRes.status === 413) && attempt < 2) {
                console.warn('[Jasmine] sandbox/update', updRes.status, 'retrying...');
                await new Promise((r) => setTimeout(r, 3000));
              } else {
                const data = await updRes.json().catch(() => ({}));
                setError(data?.error || 'Preview update failed. Click Retry to apply your code.');
              }
            } catch (e) {
              console.warn('[Jasmine] sandbox update failed:', e?.message);
              if (attempt < 2) await new Promise((r) => setTimeout(r, 3000));
              else setError(e?.message || 'Preview update failed. Click Retry to apply your code.');
            }
          }
        } else {
          pendingSandboxApplyRef.current = { ...filesToApply };
        }
      }

      console.log('[Jasmine] generate complete', project ? Object.keys(project.files).length + ' files' : 'no project');
      trackGeneration({ provider, fileCount: project?.files ? Object.keys(project.files).length : 0, hasContextFiles: contextFiles?.length > 0, hasSearchContext: searchContext?.length > 0 });
      const msg = 'I\'ve generated your project. Ask me to edit it — e.g. "Make the header darker" or "Add a pricing section".';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
      const commands = extractSlashCommands(result);
      if (commands.length > 0) {
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        runSlashCommands(commands, {
          apiBase,
          sandboxId: currentSandboxId,
          deployUrl: currentDeployUrl,
          netlifyUrl,
          generatedProject: project,
          setDeployUrl,
          setSandboxId,
          setSandboxStarting,
          setChatMessages,
          setError,
          setRightTab,
          setPreviewRetryKey,
          applyPackageFixes,
          ensurePackageDependencies,
          downloadProject: async () => {
            try {
              await downloadProjectAsZip(project, result);
            } catch (e) {
              setError(e?.message || 'Download failed');
            }
          },
          fixProjectErrors,
          provider,
          groqKey,
          geminiKey,
          gatewayModel,
          setGeneratedProject,
          setNetlifyUrl,
          retryPreviewUpdate,
        });
      }
      if (firebaseConfigured && user && project?.files) {
        const finalMessages = [...chatMessages, { role: 'assistant', content: 'I\'ve generated your project. Ask me to edit it — e.g. "Make the header darker" or "Add a pricing section".' }];
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
      const res = await fetchApiCompressed(`${apiBase}/api/deploy`, { target: 'netlify', sandboxId: sid, files });
      const data = await parseJsonResponse(res);
      if (data.success && data.url) {
        setNetlifyUrl(data.url);
        trackDeploy({ platform: 'netlify' });
      } else {
        setError(data?.error || 'Deploy failed');
      }
    } catch (e) {
      setError(e?.message || 'Deploy failed');
    } finally {
      setNetlifyDeploying(false);
    }
  };

  const pushToGitHub = async () => {
    const files = generatedProject?.files;
    if (!files || Object.keys(files).length === 0) {
      setError('Generate a project first');
      return;
    }
    setGithubPushing(true);
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const repoName = (prompt?.slice(0, 50) || 'jasmine-project').replace(/[^a-zA-Z0-9._-]/g, '-');
      const res = await fetch(`${apiBase}/api/github/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, repoName, description: prompt?.slice(0, 200) || 'Generated with Jasmine', isPrivate: true }),
      });
      const data = await parseJsonResponse(res);
      if (data.success && data.url) {
        setGithubUrl(data.url);
        trackDeploy({ platform: 'github' });
      } else {
        setError(data?.error || 'GitHub push failed');
      }
    } catch (e) {
      setError(e?.message || 'GitHub push failed');
    } finally {
      setGithubPushing(false);
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
    const useGroqEdit = provider === 'ai-gateway' && gatewayModel === 'kimi-k2.5';
    const editKey = useGroqEdit ? import.meta.env.VITE_GROQ_API_KEY : provider === 'openai' ? import.meta.env.VITE_OPENAI_API_KEY : provider === 'ai-gateway' ? '' : import.meta.env.VITE_GEMINI_API_KEY;
    if (!useGroqEdit && provider !== 'ai-gateway' && !editKey) { setError('API key required'); return; }
    if (useGroqEdit && !editKey) { setError('Add VITE_GROQ_API_KEY for Kimi'); return; }

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsEditing(true);
    setError('');
    setStreamingRaw('');
    setRightTab(htmlMode ? 'preview' : 'files');

    const currentCode = (generatedProject?.files && projectToRaw(generatedProject)) || generatedHTML || streamingRaw;
    if (!currentCode) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Generate first.' }]);
      setIsEditing(false);
      return;
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const editSysPrompt = htmlMode ? HTML_EDIT_SYSTEM_PROMPT : undefined;
      const groqModelEdit = GROQ_MODEL_KIMI;
      const editFn =
        provider === 'gemini'
          ? (k, c, m, onC, cf) => editWithGemini(k, c, m, onC, cf, editSysPrompt)
          : useGroqEdit
            ? (k, c, m, onC, cf) => editWithGroq(k, c, m, onC, cf, editSysPrompt, groqModelEdit)
            : provider === 'ai-gateway'
              ? (_, c, m, onC, cf) => editWithGateway(apiBase, gatewayModel, c, m, onC, cf, editSysPrompt)
              : provider === 'openai'
                ? (k, c, m, onC, cf) => editWithOpenAI(k, c, m, onC, cf, editSysPrompt)
                : (k, c, m, onC, cf) => editWithGemini(k, c, m, onC, cf, editSysPrompt);
      const keyForEdit = (useGroqEdit || provider === 'openai' || provider === 'gemini') ? editKey : '';
      const result = await editFn(keyForEdit, currentCode, msg, (chunk) => setStreamingRaw(chunk), contextFiles);
      const project = extractNextProject(result, generatedProject?.files || null);
      if (project?.files) {
        const editApiBase = import.meta.env.VITE_API_URL || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        const replaced = {};
        for (const [path, content] of Object.entries(project.files)) {
          replaced[path] = await replaceImagePlaceholders(String(content), apiBase, geminiKey);
        }
        const mergedFiles = { ...(generatedProject?.files || {}), ...replaced };
        if (!htmlMode) {
          applyPackageFixes(mergedFiles);
          ensurePackageDependencies(mergedFiles);
        }
        setGeneratedProject({ files: mergedFiles });
        if (Object.keys(mergedFiles).length > 0 && !htmlMode) {
          if (sandboxId) {
            try {
              const deps = (() => {
                try {
                  const pkg = JSON.parse(mergedFiles['package.json'] || '{}');
                  return Object.keys(pkg.dependencies || {});
                } catch { return []; }
              })();
              if (deps.length > 0) {
                setChatMessages((prev) => [...prev, { role: 'status', message: 'Installing dependencies', details: deps, icon: 'ph-package', detailLabel: 'packages' }]);
              }
              setChatMessages((prev) => [...prev, { role: 'status', message: 'Applying to preview', details: [`${Object.keys(mergedFiles).length} files`], icon: 'ph-upload-simple', detailLabel: 'files' }]);
              const updRes = await fetchApiCompressed(`${apiBase}/api/sandbox/update`, { sandboxId, files: mergedFiles });
              if (updRes.ok) setPreviewRetryKey((k) => k + 1);
            } catch (e) {
              console.warn('[Jasmine] sandbox update (edit) failed:', e?.message);
            }
          } else {
            pendingSandboxApplyRef.current = { ...mergedFiles };
          }
        }
      }
      setGeneratedHTML(result);
      console.log('[Jasmine] edit complete', project?.files ? Object.keys(project.files).length + ' files' : '');
      if (project?.files) trackEdit({ provider, fileCount: Object.keys(project.files).length });
      const summary = extractEditSummary(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: summary || (htmlMode ? 'Done. Preview updated.' : 'Done. Check the Files tab.') }]);
      setRightTab(htmlMode ? 'preview' : 'files');
      const commands = extractSlashCommands(result);
      if (commands.length > 0) {
        const proj = project?.files ? { files: project.files } : generatedProject;
        const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        runSlashCommands(commands, {
          apiBase,
          sandboxId,
          deployUrl,
          netlifyUrl,
          generatedProject: proj,
          setDeployUrl,
          setSandboxId,
          setSandboxStarting,
          setChatMessages,
          setError,
          setRightTab,
          setPreviewRetryKey,
          applyPackageFixes,
          ensurePackageDependencies,
          downloadProject: async () => {
            try {
              await downloadProjectAsZip(proj, result || generatedHTML || streamingRaw);
            } catch (e) {
              setError(e?.message || 'Download failed');
            }
          },
          fixProjectErrors,
          provider,
          groqKey,
          geminiKey,
          gatewayModel,
          setGeneratedProject,
          setNetlifyUrl,
          retryPreviewUpdate,
        });
      }
      if (firebaseConfigured && user) debouncedSave();
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
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
    htmlMode,
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
    provider,
    setProvider,
    gatewayModel,
    setGatewayModel,
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
    blogSlug,
    htmlMode,
    setHtmlMode,
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
      {!e2bBadgeDismissed && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center border border-zinc-200 bg-white shadow-lg">
          <E2BBadge
            showClose
            onClose={() => setE2bBadgeDismissed(true)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
