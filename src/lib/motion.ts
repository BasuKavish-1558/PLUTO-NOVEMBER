import type { Transition } from 'motion/react'

/** Springy default for UI movement (~200ms feel). */
export const spring: Transition = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 }

/** Short tween for fades and page transitions. */
export const quick: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] }
