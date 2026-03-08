import { useState, useCallback } from 'react';

/**
 * HTML preview: displays generated HTML with Open in new tab and Refresh.
 */
export default function EditableHtmlPreview({ html, theme }) {
  const [injectKey, setInjectKey] = useState(0);
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';
  const btnCl = isLight
    ? 'bg-[#f6f4ec] hover:bg-[#e9dfcf] border-[rgba(220,211,195,0.9)] text-text-primary'
    : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-text-primary';

  const openInNewTab = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [html]);

  return (
    <div className={`flex-1 flex flex-col min-h-0 ${isLight ? 'bg-[#f9f8f6]' : 'bg-surface'}`}>
      <div className={`flex-none flex items-center justify-between px-4 py-2.5 border-b ${borderCl} gap-3 flex-wrap`}>
        <span className="text-xs font-medium text-text-secondary">HTML preview</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openInNewTab}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${btnCl}`}
            title="Open in new tab"
          >
            <i className="ph ph-arrow-square-out text-sm" />
            Open in new tab
          </button>
          <button
            type="button"
            onClick={() => setInjectKey((k) => k + 1)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border flex items-center gap-1 transition-colors ${btnCl}`}
            title="Refresh preview"
          >
            <i className="ph ph-arrow-clockwise text-sm" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <iframe
          key={injectKey}
          srcDoc={html || ''}
          title="HTML Preview"
          className={`absolute inset-0 w-full h-full border-0 ${isLight ? 'bg-white' : 'bg-white'}`}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
