import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal to share a project via email. Recipients must sign in to access.
 */
export default function ShareModal({ project, onClose, onSuccess, theme, getIdToken }) {
  const [emails, setEmails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [deliveryWarning, setDeliveryWarning] = useState(false);

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-[rgba(220,211,195,0.9)]' : 'border-white/[0.08]';
  const inputCl = isLight
    ? 'bg-[#fffaf0] border-[rgba(220,211,195,0.9)] focus:border-[#379f57]'
    : 'bg-white/[0.06] border-white/[0.08] focus:border-jasmine-400/50';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const list = emails
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    if (list.length === 0) {
      setError('Enter at least one email');
      return;
    }

    setSending(true);
    setError('');
    try {
      const token = await getIdToken?.();
      if (!token) {
        setError('Sign in to share');
        setSending(false);
        return;
      }

      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/share-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId: project?.id, emails: list }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Failed to send invite');
        setSending(false);
        return;
      }

      if (data?.emailErrors?.length > 0) {
        const failed = data.emailErrors.map((e) => `${e.email}: ${e.error}`).join('; ');
        setError(`Some invites failed: ${failed}. Add and verify your domain at resend.com/domains, then set RESEND_FROM.`);
        setSending(false);
        return;
      }

      setDeliveryWarning(!!data?.deliveryWarning);
      setSent(true);
      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`relative w-full max-w-md rounded-xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-transparent">
          <h3 className="text-sm font-semibold text-text-primary">Share project</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <i className="ph ph-x text-lg" />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-sm text-text-secondary mb-4">
            Invite collaborators by email. They'll need to sign in to view and edit.
          </p>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <i className="ph ph-check-circle text-3xl text-jasmine-400 mb-2 block" />
                <p className="text-sm text-text-primary font-medium">Invites sent</p>
                <p className="text-xs text-text-muted mt-1">Recipients will receive an email with a link.</p>
                {deliveryWarning && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-left">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Recipients may not receive emails</p>
                    <p className="text-xs text-text-secondary mt-1">
                      The default sender only delivers to the Resend account owner. To reach recipients: add and verify your domain at{' '}
                      <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline text-jasmine-400">resend.com/domains</a>, then set <code className="text-xs bg-black/10 dark:bg-white/10 px-1 rounded">RESEND_FROM=Jasmine &lt;share@yourdomain.com&gt;</code> in your env vars and redeploy.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Email addresses (comma or space separated)
                  </label>
                  <textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="colleague@example.com, friend@company.com"
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none ${inputCl} text-text-primary placeholder:text-text-muted`}
                    disabled={sending}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400">{error}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-2 text-sm text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-premium px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <i className="ph ph-circle-notch animate-spin text-base" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="ph ph-paper-plane-tilt text-base" />
                        Send invites
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
