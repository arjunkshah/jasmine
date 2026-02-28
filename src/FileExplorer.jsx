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

function TreeItem({ name, value, path, selectedPath, onSelect, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);
  const isFile = typeof value === 'string';
  const isFolder = !isFile && value && typeof value === 'object';

  if (isFile) {
    const isSelected = selectedPath === path;
    return (
      <button
        onClick={() => onSelect(path, value)}
        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm truncate ${
                isSelected ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:bg-zinc-800/50'
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
        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-sm text-zinc-400 hover:bg-zinc-800/50"
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ files, streamingRaw, isStreaming, onSelectFile }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedContent, setSelectedContent] = useState('');

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

  return (
    <div className="flex h-full">
      <div className="w-56 flex-shrink-0 border-r border-zinc-800 overflow-y-auto py-2">
        {hasFiles ? (
          <TreeItem
            name="."
            value={tree}
            path=""
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        ) : (
          <div className="px-4 py-6 text-sm text-zinc-500">
            {isStreaming ? 'Parsing files...' : 'No files yet'}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {selectedPath ? (
          <pre className="p-4 text-[13px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
            <code>{selectedContent}</code>
            {isStreaming && selectedPath && <span className="inline-block w-2 h-4 ml-0.5 bg-white/80 animate-pulse" aria-hidden />}
          </pre>
        ) : showRawStream ? (
          <pre className="p-4 text-[13px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
            <code>{(streamingRaw || '').trim()}</code>
            <span className="inline-block w-2 h-4 ml-0.5 bg-jasmine-400 animate-pulse" aria-hidden />
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            {hasFiles ? 'Select a file' : (isStreaming ? 'Streaming...' : 'Generate a project')}
          </div>
        )}
      </div>
    </div>
  );
}
