import { motion } from 'framer-motion';
import { blurPopUp } from '../lib/animations';

/**
 * Linear-style blur reveal triggered when element scrolls into view
 * @see https://github.com/anoopraju31/linear-landing-page
 */
export default function BlurPopUpInView({ children, delay = 0, className = '', amount = 0.1 }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount }}
      variants={blurPopUp}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
