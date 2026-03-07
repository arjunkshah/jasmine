/**
 * Linear-style ambient lighting for hero — soft gradient blobs
 * @see https://github.com/anoopraju31/linear-landing-page
 */
export default function AmbientLighting({ isLight = false }) {
  const gradientA = isLight
    ? 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0,0%,40%,0.06) 0, hsla(0,0%,20%,0.02) 50%, transparent 80%)'
    : 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0,0%,85%,0.08) 0, hsla(0,0%,55%,0.02) 50%, hsla(0,0%,45%,0) 80%)';
  const gradientB = isLight
    ? 'radial-gradient(50% 50% at 50% 50%, hsla(0,0%,40%,0.05) 0, hsla(0,0%,20%,0.02) 80%, transparent 100%)'
    : 'radial-gradient(50% 50% at 50% 50%, hsla(0,0%,85%,0.06) 0, hsla(0,0%,45%,0.02) 80%, transparent 100%)';
  const gradientC = isLight
    ? 'radial-gradient(50% 50% at 50% 50%, hsla(0,0%,40%,0.03) 0, hsla(0,0%,20%,0.01) 80%, transparent 100%)'
    : 'radial-gradient(50% 50% at 50% 50%, hsla(0,0%,85%,0.04) 0, hsla(0,0%,45%,0.02) 80%, transparent 100%)';

  return (
    <div className="absolute top-0 left-0 w-full h-screen pointer-events-none select-none overflow-hidden" aria-hidden>
      <div className="absolute inset-0 isolate pointer-events-none">
        <div
          className="absolute rounded-full top-0 left-0 h-[1380px] w-[560px] -translate-y-[350px] -rotate-45"
          style={{ background: gradientA }}
        />
        <div
          className="absolute rounded-full top-0 left-0 h-[1380px] w-[240px] -rotate-45 translate-x-[5%] -translate-y-[50%] origin-top-left"
          style={{ background: gradientB }}
        />
        <div
          className="absolute rounded-full top-0 left-0 w-[240px] h-[1380px] -rotate-45 -translate-x-[180%] -translate-y-[70%] origin-top-left"
          style={{ background: gradientC }}
        />
      </div>
    </div>
  );
}
