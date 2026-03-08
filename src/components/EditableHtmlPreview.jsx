import { useState, useCallback, useEffect } from 'react';
import { getHtmlPages, getHtmlPreviewContent } from '../api';

/**
 * HTML preview: displays generated HTML with Open in new tab and Refresh.
 * When project has multiple HTML pages, shows a page selector.
 */
export default function EditableHtmlPreview({ html: htmlProp, project, theme }) {
  const [injectKey, setInjectKey] = useState(0);
  const [selectedPage, setSelectedPage] = useState('index.html');
  const pages = project ? getHtmlPages(project) : [];

  useEffect(() => {
    if (pages.length > 0 && !pages.includes(selectedPage)) {
      setSelectedPage(pages[0]);
    }
  }, [pages.join(','), selectedPage]);
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';
  const btnCl = isLight
    ? 'bg-[#f6f4ec] hover:bg-[#e9dfcf] border-[rgba(220,211,195,0.9)] text-text-primary'
    : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.08] text-text-primary';

  const html = project ? getHtmlPreviewContent(project, selectedPage) : htmlProp || '';

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
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">HTML preview</span>
          {pages.length > 1 && (
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${btnCl}`}
            >
              {pages.map((p) => (
                <option key={p} value={p}>{p.replace('.html', '').replace('.htm', '')}</option>
              ))}
            </select>
          )}
        </div>
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
