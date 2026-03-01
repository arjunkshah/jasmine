import { motion } from 'framer-motion';
import { illustrate } from '../lib/animations';

/**
 * Linear-style illustration reveal (opacity + 3D translate)
 * @see https://github.com/anoopraju31/linear-landing-page
 */
export default function IllustrateAnimate({ children, delay = 0, duration = 0.6, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={illustrate}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
