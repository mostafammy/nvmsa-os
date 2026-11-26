import type { Transition } from 'motion/react';

export const MOTION_SPRINGS = {
  snappy: {
    type: 'spring',
    stiffness: 480,
    damping: 36,
    mass: 0.9,
  },
  sheet: {
    type: 'spring',
    stiffness: 400,
    damping: 34,
    mass: 0.95,
  },
  swipe: {
    type: 'spring',
    stiffness: 420,
    damping: 38,
    mass: 0.9,
  },
  gentle: {
    type: 'spring',
    stiffness: 280,
    damping: 28,
    mass: 1,
  },
  recoil: {
    type: 'spring',
    stiffness: 520,
    damping: 26,
    mass: 0.8,
  },
} satisfies Record<string, Transition>;
