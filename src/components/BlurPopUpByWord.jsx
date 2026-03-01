import { motion } from 'framer-motion';
import { blurPopUp } from '../lib/animations';

/**
 * Linear-style word-by-word blur reveal for headlines
 * @see https://github.com/anoopraju31/linear-landing-page
 */
export default function BlurPopUpByWord({ text, className = '', wordDelay = 0.04 }) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          className="inline-block"
          initial="initial"
          animate="animate"
          variants={blurPopUp}
          transition={{
            duration: 0.6,
            delay: idx * wordDelay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {idx + 1 < words.length ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
