import { useState, useEffect } from 'react';

const TESTIMONIALS = [
  { quote: "Generated a law firm site in 20 seconds. Looked like we paid a design agency.", author: "Founder", role: "Legal startup" },
  { quote: "The typography and spacing are insane. No way this is AI.", author: "Designer", role: "YC-backed" },
  { quote: "Finally, an AI that doesn't output slop. Jasmine gets it.", author: "Engineer", role: "Indie hacker" },
];

export default function AuthPage({ onClose, onSignIn, onSignUp, onGoogle, onSuccess, theme, isClosing }) {
  const [mode, setMode] = useState('signin');
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 10);
    return () => clearTimeout(t);
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 focus:border-jasmine-400' : 'bg-white/[0.04] border-white/[0.08] focus:border-jasmine-400/50';

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

  const isVisible = hasEntered && !isClosing;

  return (
    <div
      className="fixed inset-0 z-[200] flex transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.98)',
        pointerEvents: isClosing ? 'none' : 'auto',
      }}
    >
      {/* Left: background + testimonials */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/auth-bg.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-900/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <i className="ph ph-x text-xl"></i>
          </button>
          <div className="pt-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                <i className="ph ph-sparkle text-jasmine-400 text-lg"></i>
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">jasmine</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-[1.15] max-w-md text-3d-dark">
              The world's best designer.
            </h1>
            <p className="mt-3 text-white/70 text-sm max-w-sm">
              Describe what you want. Jasmine crafts it. Edit, download, deploy.
            </p>
          </div>
          <div className="space-y-4 mt-12">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 max-w-sm"
              >
                <p className="text-sm text-white/90 leading-relaxed">"{t.quote}"</p>
                <p className="mt-2 text-xs text-white/60">{t.author} · {t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: credentials form */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${isLight ? 'bg-zinc-50' : 'bg-surface'}`}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg border ${borderCl} flex items-center justify-center`}>
                <i className="ph ph-sparkle text-jasmine-400 text-sm"></i>
              </div>
              <span className="font-semibold text-text-primary">jasmine</span>
            </div>
            <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary transition-colors">
              <i className="ph ph-x text-lg"></i>
            </button>
          </div>

          <h2 className="text-3d text-2xl font-bold text-text-primary tracking-tight mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-text-muted mb-8">
            {mode === 'signin' ? 'Sign in to save and manage your projects.' : 'Get started with Jasmine.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl text-sm border ${inputCl} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 transition-colors`}
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
                className={`w-full px-4 py-3 rounded-xl text-sm border ${inputCl} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 transition-colors`}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <i className="ph ph-warning-circle"></i>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className={`px-3 ${isLight ? 'bg-zinc-50' : 'bg-surface'} text-text-muted`}>or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border ${borderCl} text-text-primary hover:bg-white/[0.04] transition-colors disabled:opacity-50`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-text-muted">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError(''); }} className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
