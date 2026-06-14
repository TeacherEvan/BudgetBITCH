import { Transition } from 'framer-motion';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const transitions = {
  spring: { type: 'spring', stiffness: 260, damping: 20 } as Transition,
  easeOut: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } as Transition,
  easeInOut: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
  quick: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
};

export function getTransition(type: keyof typeof transitions = 'easeOut'): Transition {
  if (prefersReducedMotion()) {
    return { duration: 0.01, ease: 'linear' };
  }
  return transitions[type];
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const staggerItem = (index: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.easeOut, delay: index * 0.1 },
  },
});