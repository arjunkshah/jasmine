import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const ADMIN_KEY_STORAGE = 'jasmine_admin_key';

function useAdminKey() {
  const [key, setKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) || '');
  useEffect(() => {
    if (key) localStorage.setItem(ADMIN_KEY_STORAGE, key);
  }, [key]);
  return [key, setKey];
}

function apiHeaders(adminKey) {
  const h = { 'Content-Type': 'application/json' };
  if (adminKey) h['x-admin-key'] = adminKey;
  return h;
}

function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]',
    todo: 'bg-[#E8E6E3] text-[var(--color-text-primary)]',
    in_progress: 'bg-[#FFF9C4] text-[var(--color-text-primary)]',
    done: 'bg-[#C0F2C0] text-[var(--color-text-primary)]',
    low: 'bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)]',
    medium: 'bg-[#FFF9C4]/80 text-[var(--color-text-primary)]',
    high: 'bg-[#FFB6C1] text-[var(--color-text-primary)]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border border-transparent ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

function formatDate(v) {
  if (!v) return '—';
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const SIDEBAR_TABS = [
  { id: 'tasks', label: 'Tasks', icon: 'ph-clipboard-text' },
  { id: 'projects', label: 'Projects', icon: 'ph-folder-open' },
  { id: 'settings', label: 'Settings', icon: 'ph-gear-six' },
];

export default function AdminDashboard({ theme, onBack, fullScreen = false, onThemeToggle }) {
  const [adminKey, setAdminKey] = useAdminKey();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('Admin tasks backend removed.');
    setTasks([]);
    setLoading(false);
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('Admin projects backend removed.');
    setProjects([]);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    if (tab === 'tasks') fetchTasks();
    else if (tab === 'projects') fetchProjects();
  }, [tab, fetchTasks, fetchProjects]);

  const createTask = async () => {
    setError('Admin tasks backend removed.');
  };

  const updateTask = async (_id, _updates) => {
    setError('Admin tasks backend removed.');
  };

  const deleteTask = async (_id) => {
    setError('Admin tasks backend removed.');
  };

  const toggleTaskDone = (t) => {
    updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' });
  };

  const isLight = theme === 'light';
  const borderCl = 'border-[var(--color-border-default)]';

  return (
    <div className={`flex bg-[var(--color-surface)] text-[var(--color-text-primary)] ${fullScreen ? 'fixed inset-0 h-screen w-screen' : 'flex-col h-full'}`}>
      {/* Sidebar */}
      <aside className={`flex flex-col shrink-0 w-64 border-r ${borderCl} bg-[var(--color-surface-raised)]`}>
        <div className="p-6 border-b border-[var(--color-border-default)]">
          <h1 className="text-lg font-semibold tracking-tight">Admin</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Jasmine Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SIDEBAR_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[var(--color-text-primary)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)]'
              }`}
            >
              <i className={`ph ${t.icon} text-lg`} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border-default)] space-y-2">
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            >
              <i className={`ph text-lg ${isLight ? 'ph-moon' : 'ph-sun'}`} />
              {isLight ? 'Dark mode' : 'Light mode'}
            </button>
          )}
          {onBack && (
            <a
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-overlay)] transition-colors"
            >
              <i className="ph ph-arrow-left text-lg" />
              Back to app
            </a>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shrink-0">
          <h2 className="text-base font-semibold capitalize">{tab.replace('_', ' ')}</h2>
          <div className="flex items-center gap-3">
            {tab !== 'settings' && (
              <button
                onClick={tab === 'tasks' ? fetchTasks : fetchProjects}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Refresh"
              >
                <i className="ph ph-arrow-clockwise text-lg" />
              </button>
            )}
            {tab === 'settings' && (
              <>
                {showKeyInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Admin key"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="w-40 px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                    />
                    <button
                      onClick={() => setShowKeyInput(false)}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    >
                      Hide
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowKeyInput(true)}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    {adminKey ? '••••••••' : 'Admin key'}
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
            <i className="ph ph-warning text-lg shrink-0" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'tasks' && (
            <div className="max-w-4xl space-y-6">
              <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-4">Add task</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
                  <input
                    placeholder="Title"
                    value={newTask.title}
                    onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && createTask()}
                    className="px-4 py-2.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                  />
                  <input
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && createTask()}
                    className="px-4 py-2.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                  />
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask((t) => ({ ...t, status: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button
                    onClick={createTask}
                    disabled={loading || !newTask.title.trim()}
                    className="btn-premium px-6 py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add task
                  </button>
                </div>
              </section>

              {loading && tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <i className="ph ph-circle-notch animate-spin text-3xl" />
                  <span>Loading tasks...</span>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <i className="ph ph-clipboard-text text-4xl opacity-50" />
                  <p className="text-sm">No tasks yet.</p>
                  <p className="text-xs">Add one above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((t) => (
                    <div
                      key={t.id}
                      className={`rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-sm transition-colors ${t.status === 'done' ? 'opacity-75' : ''}`}
                    >
                      {editingTask?.id === t.id ? (
                        <div className="space-y-4">
                          <input
                            defaultValue={t.title}
                            onBlur={(e) => updateTask(t.id, { title: e.target.value })}
                            className="w-full px-4 py-2 text-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                            autoFocus
                          />
                          <textarea
                            defaultValue={t.description}
                            onBlur={(e) => updateTask(t.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 text-sm rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                          />
                          <div className="flex flex-wrap gap-2">
                            <select
                              defaultValue={t.status}
                              onChange={(e) => updateTask(t.id, { status: e.target.value })}
                              className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border-default)]"
                            >
                              <option value="todo">Todo</option>
                              <option value="in_progress">In progress</option>
                              <option value="done">Done</option>
                            </select>
                            <select
                              defaultValue={t.priority}
                              onChange={(e) => updateTask(t.id, { priority: e.target.value })}
                              className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border-default)]"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                            <button
                              onClick={() => setEditingTask(null)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-overlay)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)]"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => toggleTaskDone(t)}
                            className={`mt-1 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              t.status === 'done'
                                ? 'border-[#C0F2C0] bg-[#C0F2C0]'
                                : 'border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]'
                            }`}
                          >
                            {t.status === 'done' && <i className="ph ph-check text-xs text-[var(--color-text-primary)]" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-[var(--color-text-primary)] ${t.status === 'done' ? 'line-through text-[var(--color-text-muted)]' : ''}`}>
                              {t.title}
                            </h3>
                            {t.description && (
                              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge variant={t.status}>{t.status.replace('_', ' ')}</Badge>
                              <Badge variant={t.priority}>{t.priority}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => setEditingTask(t)}
                              className="p-2 rounded-lg hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                              title="Edit"
                            >
                              <i className="ph ph-pencil-simple" />
                            </button>
                            <button
                              onClick={() => deleteTask(t.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <i className="ph ph-trash" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'projects' && (
            <div className="max-w-4xl space-y-4">
              {loading && projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <i className="ph ph-circle-notch animate-spin text-3xl" />
                  <span>Loading projects...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-muted)]">
                  <i className="ph ph-folder-open text-4xl opacity-50" />
                  <p className="text-sm">No projects yet.</p>
                  <p className="text-xs">Projects require admin key (Settings tab).</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-sm hover:border-[var(--color-border-subtle)] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[var(--color-text-primary)] truncate">{p.name || 'Untitled'}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                            {p.userId?.slice(0, 16)}…
                          </p>
                          {p.prompt && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">{p.prompt}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1">
                              <i className="ph ph-file" />
                              {p.fileCount ?? 0} files
                            </span>
                            <span>{p.provider || '—'}</span>
                            <span>{formatDate(p.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-4">Admin API Key</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Required for creating/editing tasks and viewing projects. Set in the top bar or enter below.
                </p>
                <input
                  type="password"
                  placeholder="Admin key (ADMIN_API_KEY from Vercel)"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
                />
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
