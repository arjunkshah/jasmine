/**
 * Standalone admin dashboard at /admin
 * Password: zerotone (Vercel env)
 * Full-screen layout with sidebar — no main app header
 */
import { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'zerotone';
const ADMIN_AUTH_STORAGE = 'jasmine_admin_auth';

function isAdminRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/admin' || window.location.hash === '#admin';
}

export default function AdminPage() {
  useEffect(() => {
    if (window.location.hash === '#admin') {
      window.history.replaceState({}, '', '/admin');
    }
  }, []);

  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_STORAGE) === '1';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('jasmine_theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADMIN_AUTH_STORAGE, '1');
      } catch {}
      setAuthed(true);
      setPassword('');
    } else {
      setError('Incorrect password');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--color-surface)]">
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">Admin</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Enter password to continue</p>
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text-primary)]/20"
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
          <button type="submit" className="w-full btn-premium py-3">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminDashboard
      theme={theme}
      onBack={null}
      fullScreen
      onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    />
  );
}

export { isAdminRoute };
