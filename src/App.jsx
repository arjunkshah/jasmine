import { useState, useRef, useEffect } from 'react';
import { generateWithGroq, generateWithGemini, editWithGroq, editWithGemini, extractNextProject } from './api';
import FileExplorer from './FileExplorer';

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rightTab, setRightTab] = useState('files');
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('jasmine_provider') || 'groq');
  const [error, setError] = useState('');
  const [streamingRaw, setStreamingRaw] = useState('');
  const [generatedProject, setGeneratedProject] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jasmine_history') || '[]'); } catch { return []; }
  });

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => { localStorage.setItem('jasmine_provider', provider); }, [provider]);
  useEffect(() => { localStorage.setItem('jasmine_history', JSON.stringify(history.slice(0, 20))); }, [history]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const getKey = () => provider === 'groq' ? import.meta.env.VITE_GROQ_API_KEY : import.meta.env.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!prompt.trim()) { setError('Enter a prompt'); textareaRef.current?.focus(); return; }
    const key = getKey();
    if (!key) { setError(`Add VITE_${provider === 'groq' ? 'GROQ' : 'GEMINI'}_API_KEY to .env`); return; }

    setIsGenerating(true);
    setError('');
    setStreamingRaw('');
    setGeneratedHTML('');
    setGeneratedProject(null);
    setDeployUrl(null);
    setChatMessages([{ role: 'user', content: prompt }]);

    try {
      const fn = provider === 'groq' ? generateWithGroq : generateWithGemini;
      const result = await fn(key, prompt, (chunk) => setStreamingRaw(chunk));
      const project = extractNextProject(result);
      if (project) setGeneratedProject(project);
      setGeneratedHTML(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Generated. Ask me to edit — e.g. "Make the header darker" or "Add a pricing section".' }]);
      setHistory((prev) => [{ prompt: prompt.slice(0, 100), timestamp: Date.now(), html: result, project: project || null, provider }, ...prev]);
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || isEditing) return;
    const key = getKey();
    if (!key) { setError('API key required'); return; }

    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatInput('');
    setIsEditing(true);
    setError('');
    setStreamingRaw('');

    const currentCode = generatedHTML || streamingRaw;
    if (!currentCode) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Generate first.' }]);
      setIsEditing(false);
      return;
    }

    try {
      const fn = provider === 'groq' ? editWithGroq : editWithGemini;
      const result = await fn(key, currentCode, msg, (chunk) => setStreamingRaw(chunk));
      const project = extractNextProject(result);
      if (project?.files) setGeneratedProject((prev) => ({ files: { ...(prev?.files || {}), ...project.files } }));
      setGeneratedHTML(result);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Done. Check Files.' }]);
      setRightTab('files');
    } catch (err) {
      setError(err.message);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsEditing(false);
    }
  };

  const loadFromHistory = (item) => {
    setGeneratedHTML(item.html);
    setGeneratedProject(item.project || null);
    setPrompt(item.prompt);
    setChatMessages([{ role: 'user', content: item.prompt }, { role: 'assistant', content: 'Loaded.' }]);
  };

  const deployToSandbox = async () => {
    const project = generatedProject || extractNextProject(streamingRaw || generatedHTML);
    if (!project?.files) { setError('No project to deploy.'); return; }
    setDeploying(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(text || 'Deploy failed'); }
      if (!res.ok) throw new Error(data.error || text || 'Deploy failed');
      setDeployUrl(data.url);
    } catch (err) { setError(err.message); } finally { setDeploying(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadProject = () => {
    const content = generatedProject?.files ? JSON.stringify({ files: generatedProject.files }, null, 2) : generatedHTML;
    const blob = new Blob([content], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jasmine-project.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasOutput = generatedHTML || streamingRaw;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <header className="flex-none h-14 border-b border-zinc-800 px-4 flex items-center justify-between">
        <span className="font-semibold text-zinc-100">Jasmine</span>
        <div className="flex items-center gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          >
            <option value="groq">Kimi K2</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {!hasOutput ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-xl">
              <h1 className="text-xl font-semibold text-zinc-100 mb-2">What will you design?</h1>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && (e.preventDefault(), generate())}
                placeholder="e.g. A law firm landing page — trustworthy, navy and gold, Lora serif..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-zinc-500">⌘+Enter to generate</span>
                <button
                  onClick={generate}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 font-medium text-sm disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              {history.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs text-zinc-500 mb-2">Recent</p>
                  <div className="space-y-1">
                    {history.slice(0, 4).map((item, i) => (
                      <button
                        key={i}
                        onClick={() => loadFromHistory(item)}
                        className="block w-full text-left text-sm text-zinc-400 hover:text-zinc-200 truncate"
                      >
                        {item.prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-zinc-800">
              <div className="flex-none p-4 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Chat</p>
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                    placeholder="Edit request..."
                    className="flex-1 px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isEditing}
                    className="px-3 py-2 rounded bg-zinc-100 text-zinc-900 text-sm font-medium disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800/80 text-zinc-300'}`}>
                      {m.content}
                    </span>
                  </div>
                ))}
                {isEditing && <p className="text-sm text-zinc-500">Applying...</p>}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-none h-12 px-4 flex items-center justify-between border-b border-zinc-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRightTab('files')}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${rightTab === 'files' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setRightTab('preview')}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${rightTab === 'preview' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Preview
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {generatedProject?.files && (
                    <button
                      onClick={deployToSandbox}
                      disabled={deploying}
                      className="p-2 rounded text-zinc-500 hover:text-zinc-300"
                      title="Deploy"
                    >
                      {deploying ? '…' : '↑'}
                    </button>
                  )}
                  <button onClick={copyCode} className="p-2 rounded text-zinc-500 hover:text-zinc-300" title="Copy">
                    {copied ? '✓' : '⎘'}
                  </button>
                  <button onClick={downloadProject} className="p-2 rounded text-zinc-500 hover:text-zinc-300" title="Download">
                    ↓
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-zinc-950 relative">
                {isGenerating && !generatedHTML && rightTab === 'files' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                    <p className="text-zinc-500">Generating...</p>
                  </div>
                )}
                {rightTab === 'files' && (
                  <FileExplorer
                    files={generatedProject?.files}
                    streamingRaw={streamingRaw || generatedHTML}
                    isStreaming={isGenerating || isEditing}
                  />
                )}
                {rightTab === 'preview' && (
                  <div className="h-full flex items-center justify-center p-8">
                    {generatedProject?.files ? (
                      <div className="text-center">
                        <p className="text-zinc-300 mb-4">Next.js project ready</p>
                        <p className="text-sm text-zinc-500 mb-4">{Object.keys(generatedProject.files).length} files</p>
                        {deployUrl ? (
                          <a href={deployUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                            Open preview
                          </a>
                        ) : (
                          <button
                            onClick={deployToSandbox}
                            disabled={deploying}
                            className="px-4 py-2 rounded bg-zinc-100 text-zinc-900 text-sm font-medium disabled:opacity-50"
                          >
                            {deploying ? 'Deploying...' : 'Deploy to preview'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-500">{(isGenerating || isEditing) ? 'Generating...' : 'No project yet'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
