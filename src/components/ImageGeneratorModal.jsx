import { useState } from 'react';

export default function ImageGeneratorModal({ onClose, theme, initialPrompt = '' }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLight = theme === 'light';
  const borderCl = isLight ? 'border-zinc-200' : 'border-white/[0.06]';
  const inputCl = isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.04] border-white/[0.08]';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError('');
    setImage(null);
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (data.image) setImage(data.image);
      else throw new Error('No image in response');
    } catch (e) {
      setError(e?.message || 'Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = `jasmine-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-2xl border ${borderCl} ${isLight ? 'bg-white' : 'bg-surface-raised'} shadow-2xl p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <i className="ph ph-image text-jasmine-400 text-xl"></i>
            Generate image (Gemini)
          </h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-text-primary rounded-lg">
            <i className="ph ph-x text-lg"></i>
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Describe the image you want. Uses Gemini to generate visuals for your project.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Modern SaaS dashboard hero illustration, gradient background, abstract shapes..."
          rows={3}
          className={`w-full px-4 py-3 rounded-xl text-sm border ${inputCl} text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-jasmine-400/30 resize-none mb-4`}
        />
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-premium px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <i className="ph ph-circle-notch animate-spin"></i>
                Generating...
              </span>
            ) : (
              <>
                <i className="ph ph-sparkle mr-2"></i>
                Generate
              </>
            )}
          </button>
          {image && (
            <button onClick={handleDownload} className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-text-primary hover:bg-white/[0.04]">
              <i className="ph ph-download-simple mr-2"></i>
              Download
            </button>
          )}
        </div>
        {image && (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img src={image} alt="Generated" className="w-full h-auto max-h-80 object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}
