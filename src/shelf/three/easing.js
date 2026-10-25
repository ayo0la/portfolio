import { MOTION, rateFor } from '../motion.js'

// Per-frame exponential rates, all derived from MOTION durations (open uses a spring instead).
export const RATES = {
  hoverIn: rateFor(MOTION.hoverIn),
  hoverOut: rateFor(MOTION.hoverOut),
  openOut: rateFor(MOTION.closeDuration),
  dim: 6,
  wall: 6,
  pan: rateFor(MOTION.openDuration),
  flip: rateFor(MOTION.flipDuration),
}

export const approach = (current, target, rate, dt) =>
  current + (target - current) * Math.min(1, dt * rate)

export const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3)

export const SETTLE = 0.002
export const settled = (a, b) => Math.abs(a - b) < SETTLE
