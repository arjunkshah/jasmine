import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Linear-style animated glow lines that appear in the hero
 * @see https://github.com/frontendfyi/rebuilding-linear.app
 */
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export default function HeroGlowLines() {
  const [lines, setLines] = useState([]);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const addLine = (delay = 0) => {
      timeoutRef.current = setTimeout(() => {
        setLines((prev) => [
          ...prev.slice(-8),
          {
            id: Math.random().toString(36).slice(2),
            direction: Math.random() > 0.5 ? 'horizontal' : 'vertical',
            size: randomBetween(8, 24),
            duration: randomBetween(1200, 2800),
          },
        ]);
        addLine(randomBetween(600, 1800));
      }, delay);
    };
    addLine(randomBetween(400, 900));
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const removeLine = (id) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {lines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => setTimeout(() => removeLine(line.id), line.duration)}
            className={`absolute bg-gradient-to-r from-white/40 to-transparent ${
              line.direction === 'horizontal'
                ? 'left-0 top-[20%] h-[1px]'
                : 'right-[15%] top-0 w-[1px]'
            }`}
            style={{
              [line.direction === 'horizontal' ? 'width' : 'height']: `${line.size * 6}px`,
              animation: `glow-line-${line.direction} ${line.duration}ms ease-out forwards`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
