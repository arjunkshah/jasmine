import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addToWaitlist, isEmailInWaitlist } from '../lib/waitlist';

export default function WaitlistPage() {
  const { signUp, signInWithGoogle, isConfigured: firebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadySignedUp, setAlreadySignedUp] = useState(false);

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setAlreadySignedUp(false);
    if (!email.trim() || !password) {
      setError('Email and password required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!firebaseConfigured) {
      setError('Sign-up is not configured yet. Try again later.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      const { auth } = await import('../lib/firebase');
      const user = auth?.currentUser;
      if (user) {
        const alreadyIn = await isEmailInWaitlist(user.email);
        if (alreadyIn) {
          setAlreadySignedUp(true);
          setSuccess(true);
        } else {
          await addToWaitlist({
            email: user.email,
            uid: user.uid,
            provider: 'email',
          });
          setSuccess(true);
        }
      }
    } catch (err) {
      const msg = err?.message || 'Sign-up failed';
      if (msg.includes('auth/email-already-in-use')) {
        setAlreadySignedUp(true);
        setSuccess(true);
      } else if (msg.includes('auth/weak-password')) setError('Password must be at least 6 characters');
      else if (msg.includes('auth/invalid-email')) setError('Invalid email address');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setAlreadySignedUp(false);
    if (!firebaseConfigured) {
      setError('Sign-up is not configured yet. Try again later.');
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle();
      const { auth } = await import('../lib/firebase');
      const user = auth?.currentUser;
      if (user) {
        const alreadyIn = await isEmailInWaitlist(user.email);
        if (alreadyIn) {
          setAlreadySignedUp(true);
          setSuccess(true);
        } else {
          await addToWaitlist({
            email: user.email,
            uid: user.uid,
            provider: 'google',
          });
          setSuccess(true);
        }
      }
    } catch (err) {
      const msg = err?.message || 'Google sign-up failed';
      if (msg.includes('auth/popup-blocked')) setError('Popup blocked. Allow popups for this site.');
      else if (msg.includes('auth/popup-closed')) setError('Sign-in cancelled');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-text-primary px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-jasmine-400/20 flex items-center justify-center mx-auto">
            <i className="ph ph-check-circle text-3xl text-jasmine-400" />
          </div>
          <h1 className="text-2xl font-semibold">
            {alreadySignedUp ? "You're already on the list" : "You're on the list"}
          </h1>
          <p className="text-text-secondary">
            {alreadySignedUp
              ? "You've already signed up for the waitlist. We'll be in touch when Jasmine is ready."
              : "We'll be in touch when Jasmine is ready. In the meantime, you can access the full site with the password."}
          </p>
          <a
            href="/website"
            className="inline-flex items-center gap-2 text-jasmine-400 hover:text-jasmine-300 font-medium"
          >
            Go to website <i className="ph ph-arrow-right" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary">
      <div className="flex-1 flex">
        {/* Left: branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-zinc-950">
          <div
            className="absolute inset-0 bg-cover bg-center bg-zinc-950"
            style={{ backgroundImage: `url('/auth-bg.png')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/80 via-zinc-900/70 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center p-12 w-full">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 border border-white/20">
                <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">jasmine</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-[1.15] max-w-md">
              The world's best designer.
            </h1>
            <p className="mt-3 text-white/70 text-sm max-w-sm">
              Describe what you want. Jasmine crafts it. Edit, download, deploy.
            </p>
          </div>
        </div>

        {/* Right: signup form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
              </div>
              <span className="font-semibold text-text-primary">jasmine</span>
            </div>

            <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-1">
              Join the waitlist
            </h2>
            <p className="text-sm text-text-muted mb-8">
              Sign up to get early access when we launch.
            </p>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm border border-white/[0.08] bg-white/[0.04] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl text-sm border border-white/[0.08] bg-white/[0.04] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 transition-colors"
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 flex items-center gap-1.5">
                  <i className="ph ph-warning-circle" />
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
                    <i className="ph ph-circle-notch animate-spin text-lg" />
                    Please wait...
                  </span>
                ) : (
                  'Join waitlist'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-surface text-text-muted">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-white/[0.06] text-text-primary hover:bg-white/[0.04] transition-colors disabled:opacity-50"
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
              Already have access?{' '}
              <a href="/website" className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                Go to website
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
