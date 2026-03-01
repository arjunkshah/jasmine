const E2B_BADGE_URL = 'https://uilwcam5kj.ufs.sh/f/pcCLEhYqZ204w1rLMw40tuZMShPRcIT6JlVY8rD2bgK1LUi0';

/**
 * E2B for Startups badge — official design from E2B
 */
export default function E2BBadge({ className = '', showClose = false, onClose }) {
  return (
    <div className={`inline-flex items-stretch overflow-hidden ${className}`}>
      <a
        href="https://e2b.dev/startups"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
        title="Sponsored by E2B for Startups"
      >
        <img src={E2B_BADGE_URL} alt="E2B for Startups" className="h-6 block" />
      </a>
      {showClose && onClose && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
          className="flex items-center justify-center w-7 h-6 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-black border-l border-zinc-200 shrink-0 transition-colors"
          aria-label="Close badge"
        >
          <i className="ph ph-x text-sm" />
        </button>
      )}
    </div>
  );
}
