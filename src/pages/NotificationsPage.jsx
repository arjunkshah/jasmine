import { motion } from 'framer-motion';
import BlurPopUpByWord from '../components/BlurPopUpByWord';
import HeroGlowLines from '../components/HeroGlowLines';

function NotificationsPage({ theme, user, sharedProjects = [], loading, onLoadProject, onBackHome, onStartDesigning, onRefresh }) {
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const cardCl = isLight ? 'bg-white border border-zinc-200/70' : 'bg-white/[0.02] border border-white/[0.06]';
  const hoverCl = isLight ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.04]';
  const sectionCl = 'px-6 md:px-12 lg:px-24';
  const maxW = 'max-w-2xl mx-auto';

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <section className={`relative min-h-[40vh] flex items-center ${sectionCl} overflow-hidden`}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/hero-bg.png')` }} />
        <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-b from-white via-white/80 to-white' : 'bg-gradient-to-b from-black/40 via-surface/70 to-surface'}`} />
        <HeroGlowLines />
        <div className={`${maxW} relative w-full`}>
          <div className="flex flex-col gap-6">
            <p className="text-xs tracking-[0.12em] text-text-muted font-display">notifications</p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-text-primary font-display">
              <BlurPopUpByWord text="Shared with you" wordDelay={0.03} />
            </h1>
            <p className="text-base text-text-secondary">
              Projects others have shared with you. Sign in to see them.
            </p>
            <div className="flex gap-3">
              <button onClick={onBackHome} className={`${cardCl} px-5 py-3 rounded-lg text-sm font-medium text-text-primary flex items-center gap-2`}>
                <i className="ph ph-arrow-left"></i>
                Back
              </button>
              <button onClick={onStartDesigning} className="btn-premium flex items-center gap-2 text-sm px-6 py-3">
                <i className="ph ph-magic-wand"></i>
                Build
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`${sectionCl} py-12`}>
        <div className={maxW}>
          {!user ? (
            <div className={`${cardCl} rounded-xl p-8 text-center`}>
              <i className="ph ph-bell-ringing text-4xl text-text-muted mb-4 block"></i>
              <p className="text-text-secondary">Sign in to see projects shared with you.</p>
            </div>
          ) : loading ? (
            <div className={`${cardCl} rounded-xl p-12 text-center`}>
              <i className="ph ph-circle-notch animate-spin text-3xl text-jasmine-400 block mx-auto mb-4"></i>
              <p className="text-text-muted text-sm">Loading notifications...</p>
            </div>
          ) : sharedProjects.length === 0 ? (
            <div className={`${cardCl} rounded-xl p-8 text-center`}>
              <i className="ph ph-inbox text-4xl text-text-muted mb-4 block"></i>
              <p className="text-text-secondary">No projects shared with you yet.</p>
              <p className="text-text-muted text-sm mt-2">When someone shares a project with your email, it will appear here.</p>
              {onRefresh && (
                <button onClick={onRefresh} className="mt-4 text-sm text-jasmine-400 hover:text-jasmine-300">
                  Refresh
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {onRefresh && (
                <div className="flex justify-end mb-2">
                  <button onClick={onRefresh} disabled={loading} className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1">
                    <i className={`ph ph-arrow-clockwise text-sm ${loading ? 'animate-spin' : ''}`}></i>
                    Refresh
                  </button>
                </div>
              )}
              {sharedProjects.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onLoadProject(p)}
                  className={`w-full ${cardCl} ${hoverCl} rounded-xl p-4 text-left transition-colors border`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{p.name || 'Untitled'}</p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {p.prompt?.slice(0, 50) || 'No prompt'}
                        {(p.prompt?.length || 0) > 50 ? '…' : ''}
                      </p>
                      <p className="text-[10px] text-text-muted mt-2">{formatDate(p.updatedAt)}</p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-1 text-[10px] rounded-md bg-jasmine-400/20 text-jasmine-400">
                      Shared
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
