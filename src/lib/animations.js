/**
 * Linear-style animation variants
 * @see https://github.com/frontendfyi/rebuilding-linear.app
 */

const LINEAR_EASE = [0.22, 1, 0.36, 1];

export const blurPopUp = {
  initial: { opacity: 0, filter: 'blur(12px)', y: 24 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.8, ease: LINEAR_EASE },
  },
};

export const heroContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const heroItem = {
  initial: { opacity: 0, filter: 'blur(12px)', y: 24 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: 0.8, ease: LINEAR_EASE },
  },
};

export const illustrate = {
  initial: {
    opacity: 0,
    x: 50,
    y: -50,
    z: 300,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    x: 0,
    y: 0,
    z: 0,
    transition: { duration: 1, ease: LINEAR_EASE },
  },
};
