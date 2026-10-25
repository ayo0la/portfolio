import { MOTION } from './motion.js'

// Day/night room blend. Colors blend channel-wise in sRGB, numbers linearly.

export const PALETTES = {
  night: {
    bg: '#121110', wall: '#1a1917', shelf: '#22201d', edge: '#e8b931', edgeEmissive: '#6b4f0c',
    key: '#ffd9a0', keyIntensity: 104, ambient: 0.18, env: 0.25, coverEmissive: 0.32, coverDiffuse: 0.45, sun: 0,
  },
  day: {
    bg: '#a89a83', wall: '#ae9f86', shelf: '#3a2c20', edge: '#f3d9a4', edgeEmissive: '#000000',
    key: '#fff6e8', keyIntensity: 14, ambient: 0.28, env: 0.4, coverEmissive: 0.5, coverDiffuse: 0.38, sun: 240,
  },
}

const clamp01 = (n) => Math.min(1, Math.max(0, n))

function mixHex(a, b, t) {
  let out = '#'
  for (const i of [1, 3, 5]) {
    const ca = parseInt(a.slice(i, i + 2), 16)
    const cb = parseInt(b.slice(i, i + 2), 16)
    out += Math.round(ca + (cb - ca) * t).toString(16).padStart(2, '0')
  }
  return out
}

export function blendRoom(t) {
  const k = clamp01(t)
  const out = {}
  for (const key of Object.keys(PALETTES.night)) {
    const a = PALETTES.night[key]
    const b = PALETTES.day[key]
    out[key] = typeof a === 'string' ? mixHex(a, b, k) : a + (b - a) * k
  }
  return out
}

export const targetFor = (prefersDark) => (prefersDark ? 0 : 1)

export function nextMix(mix, target, dt, duration = MOTION.dayNightDuration) {
  const step = dt / duration
  if (mix < target) return Math.min(target, mix + step)
  if (mix > target) return Math.max(target, mix - step)
  return target
}
