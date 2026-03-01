import { useState } from 'react';
import { Link } from 'react-router-dom';
import BlurPopUpByWord from '../components/BlurPopUpByWord';
import BlurPopUp from '../components/BlurPopUp';
import { addToWaitlist } from '../lib/waitlist';
import { isFirebaseConfigured } from '../lib/firebase';

const sectionCl = 'px-6 md:px-12 lg:px-24';
const labelCl = 'text-xs tracking-[0.12em] text-text-muted mb-6';
const headingCl = 'text-2xl md:text-3xl font-semibold text-text-primary mb-4 leading-[1.2] font-display text-3d';
const maxW = 'max-w-4xl mx-auto';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured()) {
      setStatus('error');
      setErrorMsg('Waitlist is not configured. Please try again later.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      await addToWaitlist(email);
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface text-text-primary min-h-screen">
      {/* hero */}
      <section className={`relative min-h-[90vh] flex flex-col justify-center ${sectionCl} overflow-hidden`}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/hero-bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
        <div className={`relative ${maxW} w-full`}>
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">
            <div>
              <BlurPopUp delay={0}>
                <p className={`${labelCl} font-display text-3d`}>coming soon</p>
              </BlurPopUp>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.1] text-text-primary mb-6 font-display text-3d">
                <BlurPopUpByWord text="design anything." wordDelay={0.05} />
              </h1>
              <BlurPopUp delay={0.6}>
                <p className="text-base md:text-lg text-text-secondary leading-[1.6] max-w-lg mb-12">
                  the world's best ai designer. describe what you want — jasmine crafts it. every page, every section.
                </p>
              </BlurPopUp>

              <BlurPopUp delay={0.9}>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status === 'loading'}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-jasmine-400/50 transition-colors disabled:opacity-60"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-premium px-8 py-3 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <i className="ph ph-circle-notch animate-spin text-base"></i>
                        Joining...
                      </>
                    ) : status === 'success' ? (
                      <>
                        <i className="ph ph-check text-base"></i>
                        You're in
                      </>
                    ) : (
                      <>
                        <i className="ph ph-envelope-simple text-base"></i>
                        Join waitlist
                      </>
                    )}
                  </button>
                </form>
              </BlurPopUp>
              {status === 'success' && (
                <p className="mt-4 text-sm text-emerald-400">Thanks! We'll notify you when Jasmine is ready.</p>
              )}
              {status === 'error' && (
                <p className="mt-4 text-sm text-red-400">{errorMsg}</p>
              )}

              <BlurPopUp delay={1.1}>
                <p className="mt-8 text-sm text-text-muted">
                  Already have access?{' '}
                  <Link to="/closed" className="text-jasmine-400 hover:text-jasmine-300 font-medium">
                    Sign in →
                  </Link>
                </p>
              </BlurPopUp>
            </div>
            <BlurPopUp delay={1.1} className="relative hidden lg:block">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 overflow-hidden card-3d">
                <pre className="text-[12px] font-mono text-text-secondary leading-relaxed overflow-x-auto">
{`src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── components/
└── ...
`}
                </pre>
                <p className="text-xs text-text-muted mt-4">vite · react · tailwind</p>
              </div>
            </BlurPopUp>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className={`${sectionCl} py-20 border-t border-white/[0.06]`}>
        <div className={`${maxW} flex flex-col md:flex-row items-center justify-between gap-6`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-medium text-text-primary">jasmine</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>ai website designer</span>
            <span>·</span>
            <span>vite · react · tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
