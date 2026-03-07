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

export default function AdminDashboard({ theme, onBack }) {
  const [adminKey, setAdminKey] = useAdminKey();
  const [tab, setTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium' });

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.06]';
  const inputCl = isLight ? 'bg-[#fffaf0] border-[rgba(220,211,195,0.9)]' : 'bg-white/[0.04] border-white/[0.06]';

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tasks`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setTasks(j.tasks || []);
    } catch (e) {
      setError(e.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/admin/projects`, {
        headers: apiHeaders(adminKey),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setProjects(j.projects || []);
    } catch (e) {
      setError(e.message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (tab === 'tasks') fetchTasks();
    else if (tab === 'projects') fetchProjects();
  }, [tab, fetchTasks, fetchProjects]);

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: apiHeaders(adminKey),
        body: JSON.stringify(newTask),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Create failed');
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium' });
      fetchTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateTask = async (id, updates) => {
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tasks?id=${id}`, {
        method: 'PATCH',
        headers: apiHeaders(adminKey),
        body: JSON.stringify(updates),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Update failed');
      setEditingTask(null);
      fetchTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/tasks?id=${id}`, {
        method: 'DELETE',
        headers: apiHeaders(adminKey),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Delete failed');
      fetchTasks();
    } catch (e) {
      setError(e.message);
    }
  };

  const formatDate = (v) => {
    if (!v) return '—';
    const d = v?.toDate ? v.toDate() : new Date(v);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col h-full ${isLight ? 'bg-[#fffaf0]' : 'bg-surface'}`}>
      <header className={`flex items-center justify-between px-4 py-3 border-b ${borderCl}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-[#f6f4ec]' : 'hover:bg-white/[0.04]'} text-text-muted`}
          >
            <i className="ph ph-arrow-left text-lg" />
          </button>
          <h1 className="text-lg font-medium text-text-primary">Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'tasks' ? (isLight ? 'bg-white border border-[rgba(220,211,195,0.9)]' : 'bg-white/[0.08]') : 'text-text-muted hover:text-text-primary'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => setTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'projects' ? (isLight ? 'bg-white border border-[rgba(220,211,195,0.9)]' : 'bg-white/[0.08]') : 'text-text-muted hover:text-text-primary'}`}
            >
              Projects
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="password"
            placeholder="Admin key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className={`w-32 px-2 py-1.5 rounded text-xs ${inputCl} border ${borderCl} text-text-primary placeholder:text-text-muted`}
          />
          <button
            onClick={tab === 'tasks' ? fetchTasks : fetchProjects}
            className={`p-2 rounded-lg ${isLight ? 'hover:bg-[#f6f4ec]' : 'hover:bg-white/[0.04]'} text-text-muted`}
            title="Refresh"
          >
            <i className="ph ph-arrow-clockwise text-lg" />
          </button>
        </div>
      </header>

      {error && (
        <div className={`mx-4 mt-2 px-3 py-2 rounded-lg text-sm ${isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-300'}`}>
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'tasks' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'}`}>
              <h2 className="text-sm font-medium text-text-secondary mb-3">Add task</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  placeholder="Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                  className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm ${inputCl} border ${borderCl} text-text-primary`}
                />
                <input
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                  className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm ${inputCl} border ${borderCl} text-text-primary`}
                />
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask((t) => ({ ...t, status: e.target.value }))}
                  className={`px-3 py-2 rounded-lg text-sm ${inputCl} border ${borderCl} text-text-primary`}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
                  className={`px-3 py-2 rounded-lg text-sm ${inputCl} border ${borderCl} text-text-primary`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  onClick={createTask}
                  disabled={loading || !newTask.title.trim()}
                  className="px-4 py-2 rounded-lg text-sm btn-premium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {loading && tasks.length === 0 ? (
              <div className="flex items-center gap-2 text-text-muted py-8">
                <i className="ph ph-circle-notch animate-spin text-xl" />
                <span>Loading tasks...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'}`}
                  >
                    {editingTask?.id === t.id ? (
                      <div className="space-y-2">
                        <input
                          defaultValue={t.title}
                          onBlur={(e) => updateTask(t.id, { title: e.target.value })}
                          className={`w-full px-3 py-2 rounded text-sm ${inputCl} border ${borderCl}`}
                        />
                        <textarea
                          defaultValue={t.description}
                          onBlur={(e) => updateTask(t.id, { description: e.target.value })}
                          rows={2}
                          className={`w-full px-3 py-2 rounded text-sm ${inputCl} border ${borderCl}`}
                        />
                        <div className="flex gap-2">
                          <select
                            defaultValue={t.status}
                            onChange={(e) => updateTask(t.id, { status: e.target.value })}
                            className={`px-2 py-1 rounded text-xs ${inputCl} border ${borderCl}`}
                          >
                            <option value="todo">Todo</option>
                            <option value="in_progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                          <select
                            defaultValue={t.priority}
                            onChange={(e) => updateTask(t.id, { priority: e.target.value })}
                            className={`px-2 py-1 rounded text-xs ${inputCl} border ${borderCl}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <button onClick={() => setEditingTask(null)} className="text-sm text-text-muted">Done</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-text-primary">{t.title}</h3>
                          {t.description && <p className="text-sm text-text-secondary mt-1">{t.description}</p>}
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'done' ? 'bg-green-500/20' : t.status === 'in_progress' ? 'bg-amber-500/20' : 'bg-zinc-500/20'}`}>
                              {t.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${t.priority === 'high' ? 'bg-red-500/20' : t.priority === 'low' ? 'bg-zinc-500/20' : 'bg-amber-500/20'}`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setEditingTask(t)}
                            className={`p-2 rounded-lg ${isLight ? 'hover:bg-[#f6f4ec]' : 'hover:bg-white/[0.04]'} text-text-muted`}
                          >
                            <i className="ph ph-pencil-simple" />
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className={`p-2 rounded-lg ${isLight ? 'hover:bg-red-100' : 'hover:bg-red-500/20'} text-red-500`}
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
          <div className="space-y-2">
            {loading && projects.length === 0 ? (
              <div className="flex items-center gap-2 text-text-muted py-8">
                <i className="ph ph-circle-notch animate-spin text-xl" />
                <span>Loading projects...</span>
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-white/[0.02]'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-text-primary">{p.name}</h3>
                      <p className="text-sm text-text-muted mt-1">{p.userId?.slice(0, 12)}...</p>
                      {p.prompt && <p className="text-sm text-text-secondary mt-1">{p.prompt}</p>}
                      <div className="flex gap-2 mt-2 text-xs text-text-muted">
                        <span>{p.fileCount} files</span>
                        <span>{p.provider}</span>
                        <span>{formatDate(p.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
