import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Floating command palette — Cmd/Ctrl+K to open.
 * Actions: navigate, generate, deploy, download, toggle theme, etc.
 */
export default function CommandPalette({ open, onClose, actions, theme }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.08]';
  const inputCl = isLight
    ? 'bg-[#fffaf0] border-[rgba(220,211,195,0.9)] focus:border-[#379f57] placeholder:text-text-muted'
    : 'bg-white/[0.06] border-white/[0.08] focus:border-jasmine-400/50 placeholder:text-text-muted';
  const itemCl = (active) =>
    active
      ? isLight
        ? 'bg-[#f6f4ec] text-text-primary'
        : 'bg-white/[0.08] text-text-primary'
      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]';

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase().trim();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.keywords && a.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  }, [actions, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filtered.length]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || selectedIndex < 0) return;
    const item = el.children[selectedIndex];
    if (item) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
        return;
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].onSelect?.();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, filtered, selectedIndex]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-xl rounded-xl border ${borderCl} ${isLight ? 'bg-white shadow-xl' : 'bg-surface-raised shadow-2xl'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-transparent">
            <i className="ph ph-magnifying-glass text-lg text-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className={`flex-1 min-w-0 px-0 py-1 text-sm border-0 rounded-none outline-none bg-transparent text-text-primary ${inputCl.replace('border', '')}`}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-text-muted bg-white/5 border border-white/10">
              esc
            </kbd>
          </div>
          <div
            ref={listRef}
            className="max-h-[min(60vh,320px)] overflow-y-auto py-2"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-text-muted">
                No commands match
              </div>
            ) : (
              filtered.map((action, i) => (
                <button
                  key={action.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${itemCl(i === selectedIndex)}`}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => {
                    action.onSelect?.();
                    onClose();
                  }}
                >
                  {action.icon && (
                    <i className={`ph ${action.icon} text-lg text-text-muted flex-shrink-0`} />
                  )}
                  <span className="flex-1 truncate">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-text-muted bg-white/5 border border-white/10 flex-shrink-0">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
