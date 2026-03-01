import { motion } from 'framer-motion';
import { blurPopUp } from '../lib/animations';

/**
 * Linear-style block-level blur reveal with delay
 * @see https://github.com/anoopraju31/linear-landing-page
 */
export default function BlurPopUp({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={blurPopUp}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
