import { useState } from 'react';

export default function AuthModal({ onClose, onSignIn, onSignUp, onGoogle, onSuccess, theme }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.04] border-white/[0.08]';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password required');
      return;
    }
    if (password.length < 6 && mode === 'signup') {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.message || 'Authentication failed';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) setError('Invalid email or password');
      else if (msg.includes('auth/email-already-in-use')) setError('Email already in use. Sign in instead.');
      else if (msg.includes('auth/weak-password')) setError('Password must be at least 6 characters');
      else if (msg.includes('auth/popup-blocked')) setError('Popup blocked. Allow popups for this site.');
      else if (msg.includes('auth/popup-closed')) setError('Sign-in cancelled');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await onGoogle();
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err?.message || 'Google sign-in failed';
      if (msg.includes('auth/popup-blocked')) setError('Popup blocked. Allow popups for this site.');
      else if (msg.includes('auth/popup-closed')) setError('Sign-in cancelled');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-2xl p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="w-7 h-7 object-contain" />
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded-lg">
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-4 py-2.5 rounded-xl text-sm border ${inputCl} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30`}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 rounded-xl text-sm border ${inputCl} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30`}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-premium w-full py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ph ph-circle-notch animate-spin text-lg"></i>
                Please wait...
              </span>
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${borderCl}`} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className={`px-2 ${isLight ? 'bg-white' : 'bg-surface-raised'} text-text-muted`}>or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border ${borderCl} text-text-primary hover:bg-white/[0.04] transition-colors disabled:opacity-50`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="mt-4 text-center text-sm text-text-muted">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                Sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button type="button" onClick={() => setMode('signin')} className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
