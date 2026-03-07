import { motion } from 'framer-motion';
import { blurPopUp } from '../lib/animations';

/**
 * Linear-style word-by-word blur reveal, triggered when element scrolls into view
 * Same effect as BlurPopUpByWord but with whileInView for below-the-fold content
 */
export default function BlurPopUpByWordInView({ text, className = '', wordDelay = 0.04, amount = 0.2 }) {
  const words = text.split(' ');

  return (
    <motion.span
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount }}
      variants={{
        initial: {},
        animate: {
          transition: { staggerChildren: wordDelay, delayChildren: 0 },
        },
      }}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          className="inline-block align-top"
          variants={blurPopUp}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {idx + 1 < words.length ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.span>
  );
}
