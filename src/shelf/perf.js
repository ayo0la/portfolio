// Pure performance helpers for the shelf: when to refresh shadow maps, how often a living cover
// repaints, which pixel ratio to render at, and how to cut the draw calls of a record.

const POSE_EPS = 1e-5

// A pose is [x, y, z, qx, qy, qz, qw, scale]. Shadow maps only need a refresh when a caster moved.
export function poseChanged(prev, next) {
  if (!prev) return true
  for (let i = 0; i < next.length; i++) if (Math.abs(prev[i] - next[i]) > POSE_EPS) return true
  return false
}

// Living covers repaint at 30 Hz at most; the slack lets 60 Hz frames land on every second one.
export const REPAINT_INTERVAL = 1 / 30
const REPAINT_SLACK = 0.004
export const repaintDue = (last, now) => last === null || now - last >= REPAINT_INTERVAL - REPAINT_SLACK

// The sun only casts a shadow once there is daylight to cast it (palette sun is 0 at night).
export const sunShadowOn = (mix) => mix > 0.01

// Adaptive pixel ratio. Spec caps: 1.75 desktop, 1.5 phone. A cap, not a floor.
export const DPR_TIERS = {
  desktop: [1, 1.25, 1.5, 1.75],
  phone: [1, 1.25, 1.5],
}
export const startTier = () => 1 // both start at 1.25 and climb only when frames are cheap

const FAST_MS = 20 // sustained below this: there is headroom, raise the ratio
const SLOW_MS = 50 // sustained above this: drop the ratio
export function stepTier(mode, index, avgMs) {
  const top = DPR_TIERS[mode].length - 1
  if (avgMs < FAST_MS) return Math.min(top, index + 1)
  if (avgMs > SLOW_MS) return Math.max(0, index - 1)
  return index
}

const IDLE_GAP = 0.2 // seconds; a longer gap means the loop slept, not that frames were slow

// Averages frame deltas (seconds) over `size` consecutive frames; returns ms once per full window.
export function createFrameWindow(size) {
  let n = 0
  let sum = 0
  return {
    push(delta) {
      if (delta > IDLE_GAP) { n = 0; sum = 0; return null }
      n++
      sum += delta
      if (n < size) return null
      const avg = (sum / n) * 1000
      n = 0
      sum = 0
      return avg
    },
  }
}

// A record is a rounded box with six material slots, which is six draw calls per pass per light.
// Reorder its geometry so the front face is last and everything else is one group: two draws.
// Works on indexed geometry (reorders the index) and non-indexed (reorders every attribute).
export function mergeSleeveGroups(geo, frontGroup = 4) {
  const old = geo.groups.map((g) => ({ ...g }))
  const order = [...old.filter((_, i) => i !== frontGroup), old[frontGroup]]
  const reorder = (arr, itemSize) => {
    const out = new arr.constructor(arr.length)
    let at = 0
    for (const g of order) {
      out.set(arr.subarray(g.start * itemSize, (g.start + g.count) * itemSize), at)
      at += g.count * itemSize
    }
    return out
  }
  if (geo.index) {
    geo.index.array.set(reorder(geo.index.array, 1))
    geo.index.needsUpdate = true
  } else {
    for (const name of Object.keys(geo.attributes)) {
      const a = geo.attributes[name]
      a.array.set(reorder(a.array, a.itemSize))
      a.needsUpdate = true
    }
  }
  const front = old[frontGroup]
  const rest = old.reduce((n, g, i) => (i === frontGroup ? n : n + g.count), 0)
  geo.clearGroups()
  geo.addGroup(0, rest, 0)
  geo.addGroup(rest, front.count, 1)
  return geo
}

// Once the ratio has dropped for slow frames it never climbs back (no flip-flopping).
export function nextTier(mode, index, avgMs, drops) {
  const next = stepTier(mode, index, avgMs)
  if (next > index && drops > 0) return { tier: index, drops }
  return { tier: next, drops: next < index ? drops + 1 : drops }
}

// The offscreen contact-shadow render calls gl.render, which consumes shadowMap.needsUpdate.
// Run it with the flag cleared and put the pending value back so every shadow instance, and the
// main render, still sees the refresh. Returns whether a refresh was pending.
export function withShadowFlagPreserved(shadowMap, fn) {
  const pending = shadowMap.needsUpdate
  shadowMap.needsUpdate = false
  try { fn() } finally { shadowMap.needsUpdate = pending }
  return pending
}

export const contactRefreshDue = (pending, firstFrame) => pending || firstFrame
