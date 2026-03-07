import { useState, useRef, useEffect, useCallback } from 'react';

const EDITOR_SCRIPT = `
(function() {
  const SEL = 'data-jasmine-selected';
  const HOVER = 'data-jasmine-hover';
  let selected = null;
  let toolbar = null;
  let syncTimeout = null;

  function isEditable(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (['script', 'style', 'svg', 'path'].includes(tag)) return false;
    return true;
  }

  function getEditableParent(el) {
    while (el && el !== document.body) {
      if (isEditable(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function hexFromStyle(val) {
    if (!val) return '#000000';
    if (val.startsWith('#')) return val;
    if (val.startsWith('rgb')) {
      const m = val.match(/\\d+/g);
      if (m && m.length >= 3) return '#' + [1,2,3].map(i => ('0'+parseInt(m[i-1]).toString(16)).slice(-2)).join('');
    }
    return '#000000';
  }

  function showColorPicker(prop, currentVal, onPick) {
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = hexFromStyle(currentVal);
    picker.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0';
    document.body.appendChild(picker);
    picker.click();
    picker.oninput = () => onPick(picker.value);
    picker.onblur = () => { picker.remove(); };
  }

  function showToolbar(el) {
    if (toolbar) toolbar.remove();
    selected = el;
    document.querySelectorAll('[' + SEL + ']').forEach(n => n.removeAttribute(SEL));
    document.querySelectorAll('[' + HOVER + ']').forEach(n => n.removeAttribute(HOVER));
    if (el) el.setAttribute(SEL, '1');

    toolbar = document.createElement('div');
    toolbar.id = 'jasmine-visual-toolbar';
    toolbar.innerHTML = \`
      <button type="button" data-action="edit" title="Edit text"><span>✎</span></button>
      <button type="button" data-action="color" title="Text color"><span style="color:#333">A</span></button>
      <button type="button" data-action="bg" title="Background"><span style="background:#eee;padding:0 4px">A</span></button>
      <button type="button" data-action="up" title="Move up">↑</button>
      <button type="button" data-action="down" title="Move down">↓</button>
      <button type="button" data-action="del" title="Delete">✕</button>
    \`;
    Object.assign(toolbar.style, {
      position: 'fixed', zIndex: 99999, display: 'flex', gap: '2px', padding: '4px',
      background: '#1a1a1a', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      fontFamily: 'system-ui', fontSize: '12px'
    });
    toolbar.querySelectorAll('button').forEach(btn => {
      btn.style.cssText = 'padding:6px 8px;border:none;background:transparent;color:#fff;cursor:pointer;border-radius:4px';
      btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.15)';
      btn.onmouseout = () => btn.style.background = 'transparent';
    });

    toolbar.querySelector('[data-action="edit"]').onclick = () => {
      if (el) { el.contentEditable = 'true'; el.focus(); }
    };
    toolbar.querySelector('[data-action="color"]').onclick = () => {
      showColorPicker('color', el?.style?.color, (c) => { if (el) el.style.color = c; scheduleSync(); });
    };
    toolbar.querySelector('[data-action="bg"]').onclick = () => {
      showColorPicker('bg', el?.style?.backgroundColor, (c) => { if (el) el.style.backgroundColor = c; scheduleSync(); });
    };
    toolbar.querySelector('[data-action="up"]').onclick = () => {
      if (el?.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling);
      scheduleSync();
    };
    toolbar.querySelector('[data-action="down"]').onclick = () => {
      if (el?.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el);
      scheduleSync();
    };
    toolbar.querySelector('[data-action="del"]').onclick = () => {
      if (el && confirm('Delete this element?')) { el.remove(); selected = null; toolbar?.remove(); toolbar = null; scheduleSync(); }
    };

    const rect = el?.getBoundingClientRect?.();
    if (rect) {
      toolbar.style.left = Math.max(4, rect.left) + 'px';
      toolbar.style.top = Math.max(4, rect.top - 44) + 'px';
    }
    document.body.appendChild(toolbar);
  }

  function scheduleSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      try {
        window.parent.postMessage({ type: 'jasmine-visual-edit', html: document.documentElement.outerHTML }, '*');
      } catch (e) {}
    }, 300);
  }

  const style = document.createElement('style');
  style.textContent = '[data-jasmine-selected]{outline:2px solid rgba(59,130,246,0.8) !important;outline-offset:2px}';
  document.head.appendChild(style);

  document.addEventListener('click', (e) => {
    if (e.target.closest('#jasmine-visual-toolbar')) return;
    const el = getEditableParent(e.target);
    if (el) { e.preventDefault(); e.stopPropagation(); showToolbar(el); }
  }, true);

  document.addEventListener('mouseover', (e) => {
    const el = getEditableParent(e.target);
    document.querySelectorAll('[' + HOVER + ']').forEach(n => { n.removeAttribute(HOVER); n.style.outline = ''; });
    if (el && el !== selected) {
      el.setAttribute(HOVER, '1');
      el.style.outline = '2px dashed rgba(59, 130, 246, 0.6)';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.target.closest) return;
    const el = getEditableParent(e.target);
    if (el && !el.contains(e.relatedTarget) && !el.querySelector('[data-jasmine-hover]')) {
      el.removeAttribute(HOVER);
      el.style.outline = '';
    }
  });

  document.addEventListener('input', () => scheduleSync(), true);
  document.addEventListener('blur', (e) => {
    if (e.target.contentEditable === 'true') { e.target.contentEditable = 'false'; scheduleSync(); }
  }, true);

  document.body.style.cursor = 'default';
})();
`;

/**
 * HTML preview with visual edit mode: edit copy, colors, move, delete elements.
 * Changes sync back to index.html and update the generated project.
 */
export default function EditableHtmlPreview({ html, onSave, editMode, onEditModeChange, theme }) {
  const iframeRef = useRef(null);
  const [injectKey, setInjectKey] = useState(0);
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';

  const htmlWithEditor = useCallback(() => {
    if (!html || !editMode) return html;
    const script = document.createElement('script');
    script.textContent = EDITOR_SCRIPT;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.body.appendChild(script);
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  }, [html, editMode]);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e) => {
      if (e.data?.type === 'jasmine-visual-edit' && e.data.html) {
        // Strip editor attributes before saving to source
        const cleaned = e.data.html
          .replace(/\s*data-jasmine-selected="[^"]*"/g, '')
          .replace(/\s*data-jasmine-hover="[^"]*"/g, '');
        onSave?.(cleaned);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [editMode, onSave]);

  useEffect(() => {
    if (editMode && iframeRef.current) {
      setInjectKey((k) => k + 1);
    }
  }, [editMode]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className={`flex-none flex items-center justify-between px-3 py-2 border-b ${borderCl} gap-2 flex-wrap`}>
        <span className="text-xs text-text-muted">
          {editMode ? 'Visual edit — click elements to edit' : 'HTML preview (instant)'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditModeChange?.(!editMode)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              editMode
                ? 'bg-jasmine-400/20 text-jasmine-400'
                : 'text-[#2d7f45] hover:text-[#1f5c35] hover:bg-[#2d7f45]/10'
            }`}
          >
            {editMode ? 'Done editing' : 'Edit visually'}
          </button>
          <button
            type="button"
            onClick={() => setInjectKey((k) => k + 1)}
            className="text-xs text-[#2d7f45] hover:text-[#1f5c35] flex items-center gap-1"
          >
            Refresh <i className="ph ph-arrow-clockwise text-sm" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <iframe
          key={`${injectKey}-${editMode}`}
          ref={iframeRef}
          srcDoc={htmlWithEditor()}
          title="HTML Preview"
          className="absolute inset-0 w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
