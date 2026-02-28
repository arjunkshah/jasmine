import { useState, useMemo, useEffect, useRef } from 'react';
import { extractNextProject } from './api';

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

  const codeBg = isLight ? 'bg-zinc-100/80' : 'bg-black/30';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const lineNumCl = isLight ? 'text-zinc-400' : 'text-zinc-500';
  const codeCl = isLight ? 'text-zinc-800' : 'text-zinc-300';

  return (
    <div className={`h-full flex flex-col rounded-xl overflow-hidden ${codeBg} border ${borderCl}`}>
      <div className={`flex-none px-4 py-2.5 rounded-t-xl border-b ${borderCl} ${isLight ? 'bg-zinc-200/50' : 'bg-white/[0.04]'}`}>
        <div className="flex items-center gap-2">
          <i className="ph ph-file-code text-sm text-jasmine-400"></i>
          <span className="text-sm font-medium text-text-primary truncate">{path || 'output'}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
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
  const isLight = theme === 'light';

  const project = useMemo(() => {
    if (files && typeof files === 'object' && !Array.isArray(files)) return files;
    const parsed = extractNextProject(streamingRaw || (typeof files === 'string' ? files : ''));
    return parsed?.files || {};
  }, [files, streamingRaw]);

  const tree = useMemo(() => buildTree(project), [project]);
  const prevFileCountRef = useRef(0);

  // Auto-open the file currently being streamed (last complete file)
  useEffect(() => {
    const keys = Object.keys(project);
    const count = keys.length;
    if (isStreaming && count > 0 && count > prevFileCountRef.current) {
      prevFileCountRef.current = count;
      const lastPath = keys[keys.length - 1];
      const content = project[lastPath];
      setSelectedPath(lastPath);
      setSelectedContent(typeof content === 'string' ? content : String(content));
    }
    if (!isStreaming) prevFileCountRef.current = count;
  }, [project, isStreaming]);

  const handleSelect = (path, content) => {
    setSelectedPath(path);
    setSelectedContent(content);
    onSelectFile?.(path, content);
  };

  const hasFiles = Object.keys(project).length > 0;
  const showRawStream = isStreaming && !hasFiles && (streamingRaw || '').trim().length > 0;

  const sidebarBorder = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const emptyCl = isLight ? 'text-zinc-500' : 'text-zinc-500';

  return (
    <div className="flex h-full">
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
