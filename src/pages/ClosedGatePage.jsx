import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CLOSED_ACCESS_KEY = 'jasmine_closed_access';

export function isClosedAccessGranted() {
  try {
    return sessionStorage.getItem(CLOSED_ACCESS_KEY) === '1';
  } catch {
    return false;
  }
}

export function setClosedAccessGranted(granted) {
  try {
    if (granted) {
      sessionStorage.setItem(CLOSED_ACCESS_KEY, '1');
    } else {
      sessionStorage.removeItem(CLOSED_ACCESS_KEY);
    }
  } catch {}
}

export default function ClosedGatePage({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/closed-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setClosedAccessGranted(true);
        onSuccess?.();
        navigate('/closed', { replace: true });
        window.location.reload();
      } else {
        setError(data?.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-text-primary p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-semibold text-text-primary">jasmine</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-2">Closed access</h1>
        <p className="text-sm text-text-muted mb-6">Enter your credentials to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jasmine-400/50 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jasmine-400/50 transition-colors"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium py-3 rounded-xl font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="ph ph-circle-notch animate-spin text-lg"></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="ph ph-sign-in text-lg"></i>
                Sign in
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-xs text-text-muted text-center">
          <Link to="/" className="text-jasmine-400 hover:text-jasmine-300">← Back to waitlist</Link>
        </p>
      </div>
    </div>
  );
}
