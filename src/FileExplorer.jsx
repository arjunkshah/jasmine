import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractNextProject, extractStreamingFile } from './api';

function FilePreviewPopup({ path, content, isStreaming, isLight, onClose }) {
  const scrollRef = useRef(null);
  const text = typeof content === 'string' ? content : String(content || '');
  const lines = text.split('\n');

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path || '');

  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.08]';
  const codeBg = isLight ? 'bg-zinc-50' : 'bg-black/40';
  const codeCl = isLight ? 'text-zinc-800' : 'text-zinc-300';
  const lineNumCl = isLight ? 'text-zinc-400' : 'text-zinc-500';

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex-none flex items-center justify-between px-4 py-2.5 border-b ${borderCl}`}>
          <div className="flex items-center gap-2 min-w-0">
            <i className={`ph ${isImage ? 'ph-image' : 'ph-file-code'} text-sm text-jasmine-400 shrink-0`} />
            <span className="text-sm font-medium text-text-primary truncate">{path || 'file'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <i className="ph ph-x text-lg" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-auto min-h-0">
          {isImage && (text?.startsWith('data:') || text?.startsWith('http')) ? (
            <div className="p-4 flex items-center justify-center min-h-[200px]">
              <img src={text} alt="" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            </div>
          ) : (
            <div className={`flex min-h-full ${codeBg}`}>
              <div className={`flex-none py-4 pl-4 pr-3 text-right select-none text-[13px] font-mono ${lineNumCl}`} aria-hidden>
                {lines.map((_, i) => (
                  <div key={i} className="leading-[1.6]">{i + 1}</div>
                ))}
              </div>
              <pre className={`flex-1 py-4 pr-4 pl-2 text-[13px] font-mono leading-[1.6] whitespace-pre-wrap break-words overflow-x-auto ${codeCl}`}>
                <code>{text}</code>
                {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-jasmine-400 animate-pulse" aria-hidden />}
              </pre>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/** Build tree from file paths: { 'src/app/page.tsx': '...' } -> { src: { app: { 'page.tsx': content } } } */
function buildTree(files) {
  const tree = {};
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        current[part] = content;
      } else {
        if (!current[part] || typeof current[part] === 'string') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return tree;
}

function TreeItem({ name, value, path, selectedPath, onSelect, depth = 0, isLight }) {
  const [open, setOpen] = useState(depth < 2);
  const isFile = typeof value === 'string';
  const isFolder = !isFile && value && typeof value === 'object';

  const selectedCl = isLight ? 'bg-zinc-200/80 text-zinc-900' : 'bg-white/10 text-text-primary';
  const hoverCl = isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-white/[0.06]';
  const textCl = isLight ? 'text-zinc-600' : 'text-zinc-400';

  if (isFile) {
    const isSelected = selectedPath === path;
    return (
      <button
        onClick={() => onSelect(path, value)}
        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm truncate transition-colors ${
          isSelected ? `${selectedCl} font-medium` : `${textCl} ${hoverCl}`
        }`}
        style={{ paddingLeft: 12 + depth * 12 }}
      >
        <i className="ph ph-file text-base shrink-0 opacity-60"></i>
        <span className="truncate">{name}</span>
      </button>
    );
  }

  const entries = Object.entries(value || {}).sort(([a], [b]) => {
    const aIsFile = typeof value[a] === 'string';
    const bIsFile = typeof value[b] === 'string';
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm ${textCl} ${hoverCl} transition-colors`}
        style={{ paddingLeft: 12 + depth * 12 }}
      >
        <i className={`ph ph-caret-${open ? 'down' : 'right'} text-xs shrink-0`}></i>
        <i className="ph ph-folder text-base shrink-0 opacity-60"></i>
        <span className="truncate">{name}</span>
      </button>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <TreeItem
              key={k}
              name={k}
              value={v}
              path={path ? `${path}/${k}` : k}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
              isLight={isLight}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CodeViewer({ content, path, isStreaming, isLight }) {
  const lines = content.split('\n');
  const scrollRef = useRef(null);

  const codeBg = isLight ? 'bg-zinc-100/80' : 'bg-black/30';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const lineNumCl = isLight ? 'text-zinc-400' : 'text-zinc-500';
  const codeCl = isLight ? 'text-zinc-800' : 'text-zinc-300';

  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  return (
    <div className={`h-full flex flex-col rounded-xl overflow-hidden ${codeBg} border ${borderCl}`}>
      <div className={`flex-none px-4 py-2.5 rounded-t-xl border-b ${borderCl} ${isLight ? 'bg-zinc-200/50' : 'bg-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <i className="ph ph-file-code text-sm text-jasmine-400"></i>
          <span className="text-sm font-medium text-text-primary truncate">{path || 'output'}</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          <div className={`flex-none py-4 pl-4 pr-3 text-right select-none text-[13px] font-mono ${lineNumCl}`} aria-hidden>
            {lines.map((_, i) => (
              <div key={i} className="leading-[1.6]">{i + 1}</div>
            ))}
          </div>
          <pre className={`flex-1 py-4 pr-4 pl-2 text-[13px] font-mono leading-[1.6] whitespace-pre-wrap break-words ${codeCl}`}>
            <code>{content}</code>
            {isStreaming && <span className="inline-block w-2 h-4 ml-0.5 bg-jasmine-400 animate-pulse" aria-hidden />}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function FileExplorer({ files, streamingRaw, isStreaming, onSelectFile, theme = 'dark' }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedContent, setSelectedContent] = useState('');
  const [popupOpen, setPopupOpen] = useState(false);
  const isLight = theme === 'light';

  const project = useMemo(() => {
    if (files && typeof files === 'object' && !Array.isArray(files)) return files;
    const parsed = extractNextProject(streamingRaw || (typeof files === 'string' ? files : ''));
    return parsed?.files || {};
  }, [files, streamingRaw]);

  const streamingFile = useMemo(() => {
    if (!isStreaming || !streamingRaw) return null;
    return extractStreamingFile(streamingRaw);
  }, [isStreaming, streamingRaw]);

  const displayProject = useMemo(() => {
    const out = { ...project };
    if (streamingFile && !(streamingFile.path in out)) {
      out[streamingFile.path] = streamingFile.content;
    }
    return out;
  }, [project, streamingFile]);

  const tree = useMemo(() => buildTree(displayProject), [displayProject]);

  // During streaming: switch tab to the file being streamed and keep content in sync
  useEffect(() => {
    if (isStreaming && streamingFile) {
      setSelectedPath(streamingFile.path);
      setSelectedContent(streamingFile.content);
    } else if (isStreaming && Object.keys(project).length > 0) {
      const keys = Object.keys(project);
      const lastPath = keys[keys.length - 1];
      setSelectedPath(lastPath);
      setSelectedContent(project[lastPath] ?? '');
    }
  }, [isStreaming, streamingFile, project]);

  const handleSelect = (path, content) => {
    setSelectedPath(path);
    setSelectedContent(content);
    setPopupOpen(true);
    onSelectFile?.(path, content);
  };

  const hasFiles = Object.keys(displayProject).length > 0;
  const showRawStream = isStreaming && !hasFiles && (streamingRaw || '').trim().length > 0;

  const sidebarBorder = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const emptyCl = isLight ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <div className="flex h-full relative">
      <AnimatePresence>
        {popupOpen && selectedPath && (
          <FilePreviewPopup
            key={selectedPath}
            path={selectedPath}
            content={selectedContent}
            isStreaming={isStreaming}
            isLight={isLight}
            onClose={() => setPopupOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className={`w-56 flex-shrink-0 border-r ${sidebarBorder} overflow-y-auto py-2 ${isLight ? 'bg-white/50' : 'bg-surface-raised/50'}`}>
        {hasFiles ? (
          <TreeItem
            name="."
            value={tree}
            path=""
            selectedPath={selectedPath}
            onSelect={handleSelect}
            isLight={isLight}
          />
        ) : (
          <div className={`px-4 py-6 text-sm ${emptyCl}`}>
            {isStreaming ? 'Parsing files...' : 'No files yet'}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {selectedPath ? (
          <CodeViewer
            content={selectedContent}
            path={selectedPath}
            isStreaming={isStreaming}
            isLight={isLight}
          />
        ) : showRawStream ? (
          <CodeViewer
            content={(streamingRaw || '').trim()}
            path={null}
            isStreaming={true}
            isLight={isLight}
          />
        ) : (
          <div className={`flex items-center justify-center h-full ${emptyCl} text-sm`}>
            {hasFiles ? 'Select a file' : (isStreaming ? 'Streaming...' : 'Generate a project')}
          </div>
        )}
      </div>
    </div>
  );
}
