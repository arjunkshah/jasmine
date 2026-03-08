import { useState } from 'react';

const WEBSITE_PASSWORD = 'iwillwin';

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (password === WEBSITE_PASSWORD) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('website_unlocked', '1');
      }
      onUnlock();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-text-primary px-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 border border-white/20">
            <img src="/logo-mark.png" alt="Jasmine" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-semibold text-text-primary">jasmine</span>
        </div>
        <h1 className="text-2xl font-semibold text-center">Enter password</h1>
        <p className="text-sm text-text-muted text-center">
          This site is in private beta. Enter the password to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl text-sm border border-white/[0.08] bg-white/[0.04] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 transition-colors"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <i className="ph ph-warning-circle" />
              {error}
            </p>
          )}
          <button type="submit" className="btn-premium w-full py-3 text-sm font-semibold">
            Continue
          </button>
        </form>
        <p className="text-center text-sm text-text-muted">
          <a href="/" className="text-jasmine-400 hover:text-jasmine-300">
            ← Back to waitlist
          </a>
        </p>
      </div>
    </div>
  );
}
