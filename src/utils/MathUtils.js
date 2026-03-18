export const lerp = (a, b, t) => a + (b - a) * t

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export const easeOutCubic = t => 1 - Math.pow(1 - t, 3)

export const easeInOutCubic = t =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export const randFloat = (min, max) => min + Math.random() * (max - min)

export const randInt = (min, max) => Math.floor(randFloat(min, max + 1))

export const degToRad = d => d * (Math.PI / 180)

export const radToDeg = r => r * (180 / Math.PI)

export const mapRange = (val, inMin, inMax, outMin, outMax) =>
  outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin)
