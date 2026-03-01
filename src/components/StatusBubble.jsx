import { useState } from 'react';

/**
 * Expandable status bubble for chat — e.g. "Installing dependencies" with expandable list.
 */
export default function StatusBubble({ message, details = [], icon = 'ph-package', isLight, detailLabel }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = details?.length > 0;

  return (
    <div className="text-left">
      <div
        className={`inline-block max-w-[90%] rounded-xl overflow-hidden ${
          isLight ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-500/10 border border-emerald-500/20'
        }`}
      >
        <button
          type="button"
          onClick={() => hasDetails && setExpanded((e) => !e)}
          className={`flex items-center gap-2 px-3 py-2 text-left w-full text-sm ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}
        >
          <i className={`ph ${icon} text-base shrink-0`} />
          <span className="flex-1">{message}</span>
          {hasDetails && (
            <span className="text-xs opacity-70">
              {expanded ? '▼' : '▶'} {details.length} {detailLabel || 'items'}
            </span>
          )}
        </button>
        {hasDetails && expanded && (
          <div className={`px-3 pb-3 pt-0 border-t ${isLight ? 'border-emerald-200' : 'border-emerald-500/20'}`}>
            <ul className="text-xs space-y-1 mt-2">
              {details.map((d, i) => (
                <li key={i} className={`font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400/90'}`}>
                  {typeof d === 'string' ? d : d.name || d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
