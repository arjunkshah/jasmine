import { useState, useEffect } from 'react';
import { listProjects } from '../lib/projects';

export default function ProjectSidebar({
  isOpen,
  onClose,
  onToggle,
  projects,
  onLoadProject,
  onDeleteProject,
  onNewProject,
  onSpinUpSandbox,
  loadingProjects,
  theme,
  user,
}) {
  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const hoverCl = isLight ? 'hover:bg-zinc-200/50' : 'hover:bg-white/[0.06]';
  const textCl = isLight ? 'text-zinc-600' : 'text-zinc-400';

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
    <>
      {/* Backdrop when open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-full flex flex-col bg-surface border-r ${borderCl} shadow-xl lg:relative lg:z-auto w-72 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0 lg:w-72' : '-translate-x-full lg:w-0 lg:min-w-0 lg:overflow-hidden'
        }`}
      >
        <div className={`flex-none flex items-center justify-between px-4 py-3 border-b ${borderCl}`}>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <button
              onClick={onToggle || onClose}
              className="p-2 -ml-2 text-text-muted hover:text-text-primary rounded-lg transition-colors"
              title="Close projects"
            >
              <i className="ph ph-folder-open text-jasmine-400 text-lg"></i>
            </button>
            Projects
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onNewProject?.(); if (user) onClose(); }}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors"
              title="New project"
            >
              <i className="ph ph-plus text-lg"></i>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-lg lg:hidden transition-colors"
            >
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {loadingProjects ? (
            <div className="px-4 py-8 text-center text-text-muted text-sm">
              <i className="ph ph-circle-notch animate-spin text-2xl block mb-2"></i>
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <img src="/empty-state.png" alt="" className="w-24 h-24 mx-auto mb-3 rounded-lg object-cover opacity-80" />
              <p className={`${textCl} text-sm`}>No projects yet. Generate one to get started.</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`group rounded-lg ${hoverCl} transition-colors`}
                >
                  <button
                    onClick={() => onLoadProject(p)}
                    className="w-full text-left px-3 py-2.5 rounded-lg"
                  >
                    <p className="text-sm font-medium text-text-primary truncate">
                      {p.name || 'Untitled'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 truncate">
                      {p.prompt?.slice(0, 40) || 'No prompt'}
                      {(p.prompt?.length || 0) > 40 ? '…' : ''}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      {formatDate(p.updatedAt)}
                    </p>
                  </button>
                  <div className="flex items-center gap-1 mx-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.files && Object.keys(p.files).length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSpinUpSandbox(p);
                        }}
                        className="px-2 py-1 text-xs text-jasmine-400 hover:text-jasmine-300 flex items-center gap-1 rounded"
                        title="Open in sandbox"
                      >
                        <i className="ph ph-rocket-launch"></i>
                        Sandbox
                      </button>
                    )}
                    {onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(p);
                        }}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 rounded"
                        title="Delete project"
                      >
                        <i className="ph ph-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
