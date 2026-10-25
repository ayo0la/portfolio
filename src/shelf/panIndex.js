import { panFor } from './three/layout.js'

// Index of the record the phone camera is nearest to.
export function nearestIndex(x, layout, count) {
  let best = 0
  let dist = Infinity
  for (let i = 0; i < count; i++) {
    const d = Math.abs(x - panFor(i, layout))
    if (d < dist) { dist = d; best = i }
  }
  return best
}

// "3 / 8 · Swipe", with a back chevron whenever there is something to the left (so the last
// record never reads as a dead end) and a forward chevron whenever there is more to the right.
export function indicatorState(index, count) {
  return {
    label: `${index + 1} / ${count} · Swipe`,
    back: index > 0,
    forward: index < count - 1,
  }
}

// Nudge geometry: the shelf pans a third of a record toward the next one, then springs back.
export const NUDGE = { fraction: 0.35, out: 0.45, total: 0.9 }
