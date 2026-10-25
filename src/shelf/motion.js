// Every duration in the room, in seconds (spec section 11). easing.js turns these into per-frame
// rates; Record, the camera rig, the panel and the day/night blend all read them from here.
export const MOTION = {
  entryStagger: 0.06,
  entryDuration: 0.6,
  hoverIn: 0.25,
  hoverOut: 0.35,
  hoverTipRad: 0.12,
  openDuration: 0.7,
  closeDuration: 0.5,
  flipDuration: 0.6,
  panelTextDelay: 0.12,
  nextOverlap: 0.4,
  dayNightDuration: 2.5,
}

// seconds after the section first scrolls into view that record `index` starts to settle
export const entryDelay = (index) => Math.round(index * MOTION.entryStagger * 1e6) / 1e6

// exponential approach rate that is within 1% of its target after `duration` seconds
export const rateFor = (duration) => Math.log(100) / duration

// Open: a slightly underdamped spring, so the record pulls out and eases back a hair past rest.
const OPEN_ZETA = 0.7
const OPEN_OMEGA = 4 / (OPEN_ZETA * MOTION.openDuration)

// Advance { x, v } toward target by dt seconds (semi-implicit Euler, substepped for stability).
export function stepSpring(s, target, dt, omega = OPEN_OMEGA, zeta = OPEN_ZETA) {
  const n = Math.max(1, Math.ceil(dt / 0.008))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    s.v += (omega * omega * (target - s.x) - 2 * zeta * omega * s.v) * h
    s.x += s.v * h
  }
  return s
}

// Entry: a soft spring from rest, t seconds after the record's own start. Rocks a little past 1.
const ENTRY_ZETA = 0.55
const ENTRY_OMEGA = 4 / (ENTRY_ZETA * MOTION.entryDuration)
export function entrySpring(t) {
  if (t <= 0) return 0
  if (t >= MOTION.entryDuration * 1.5) return 1
  const wd = ENTRY_OMEGA * Math.sqrt(1 - ENTRY_ZETA * ENTRY_ZETA)
  const env = Math.exp(-ENTRY_ZETA * ENTRY_OMEGA * t)
  return 1 - env * (Math.cos(wd * t) + ((ENTRY_ZETA * ENTRY_OMEGA) / wd) * Math.sin(wd * t))
}

// The HTML face may show only once the open record is at rest on the pose it is warped to: the
// open spring must be done (it overshoots ~4%, so a loose bound would fade in at peak
// misalignment), the flip within 5% of its target and the camera settled.
export function faceReady({ isOpen, delay, open, flip, wantFlip, panSettled }) {
  return !!isOpen && delay <= 0 && Math.abs(open.x - 1) < 0.01 && Math.abs(open.v) < 0.05
    && Math.abs(flip - wantFlip) < 0.05 && !!panSettled
}

export const entryDone = (index, t) => t >= entryDelay(index) + MOTION.entryDuration * 1.5
