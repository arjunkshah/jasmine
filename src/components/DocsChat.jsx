import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DOCS_SYSTEM_PROMPT = `You are a helpful assistant for Jasmine, an AI-powered design tool that turns prompts into full frontends (Vite+React or HTML). Answer questions about:

- Architecture: Vite+React frontend, Vercel serverless API, Firebase Auth/Firestore, E2B sandboxes
- Generation flow: User prompt → AI streams → extractNextProject parses ---FILE:path--- blocks → fix pass → E2B preview
- Edit flow: Chat messages → edit API → diff in ---FILE:path--- format → merge and push to sandbox
- Slash commands: /apply, /fix-errors, /create-and-apply
- Preview: E2B cloud sandboxes, /api/sandbox/start and /api/sandbox/update, hot-reload
- Output format: ---FILE:path--- blocks with code
- Error prevention: Phantom imports, Tailwind (zinc/slate allowed, dark-950 banned), Phosphor icons, package.json
- Tech stack: React 19, Vite 7, Framer Motion, Tailwind 4, Phosphor Icons, Groq/Gemini/OpenAI
- Auth: Firebase email/password + Google, Firestore projects (metadata + files subcollection)
- Deployment: Netlify, GitHub push, ZIP download

Be concise and accurate. If unsure, say so.`;

function DocsChat({ theme, className = '' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isLight = theme === 'light';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          model: 'kimi-k2.5',
          systemPrompt: DOCS_SYSTEM_PROMPT,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: full, streaming: true };
                return next;
              });
            }
          } catch (_) {}
        }
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, content: full, streaming: false };
        return next;
      });
    } catch (e) {
      const errMsg = e.message || 'Failed to get response';
      setError(errMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: errMsg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const cardCl = isLight ? 'bg-white border border-zinc-200/80 shadow-lg' : 'bg-surface-raised border border-white/[0.08] shadow-xl';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-500' : 'bg-white/[0.04] border-white/10 text-text-primary placeholder:text-text-muted';
  const btnCl = isLight ? 'bg-jasmine-400 text-zinc-900 hover:bg-jasmine-300' : 'bg-jasmine-400 text-zinc-900 hover:bg-jasmine-300';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${btnCl}`}
        aria-label="Docs AI assistant"
      >
        <i className="ph ph-robot text-lg" />
        Ask about docs
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute bottom-full right-0 mb-2 w-[380px] max-h-[420px] rounded-xl overflow-hidden ${cardCl} z-50 flex flex-col`}
          >
            <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-white/10'} flex items-center justify-between`}>
              <span className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <i className="ph ph-robot text-jasmine-400" />
                Docs assistant
              </span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors">
                <i className="ph ph-x" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[280px]">
              {messages.length === 0 && (
                <p className="text-sm text-text-muted">
                  Ask anything about Jasmine: architecture, generation flow, E2B sandboxes, slash commands, deployment, etc.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? isLight
                          ? 'bg-jasmine-100 text-zinc-900'
                          : 'bg-jasmine-400/20 text-text-primary'
                        : m.error
                          ? 'bg-red-500/10 text-red-400'
                          : isLight
                            ? 'bg-zinc-100 text-zinc-800'
                            : 'bg-white/[0.06] text-text-primary'
                    }`}
                  >
                    {m.error ? (
                      <span>{m.content}</span>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content || (m.streaming ? '…' : '')}</span>
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className={`rounded-xl px-3 py-2 text-sm ${isLight ? 'bg-zinc-100' : 'bg-white/[0.06]'}`}>
                    <span className="animate-pulse">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className={`p-3 border-t ${isLight ? 'border-zinc-200' : 'border-white/10'}`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Jasmine…"
                  disabled={loading}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${inputCl} focus:outline-none focus:ring-2 focus:ring-jasmine-400/50`}
                />
                <button type="submit" disabled={loading || !input.trim()} className={`px-4 py-2 rounded-lg text-sm font-medium ${btnCl} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  <i className="ph ph-paper-plane-tilt" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DocsChat;
