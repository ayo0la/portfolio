import { describe, it, expect, vi } from 'vitest'
import { shouldUse3D, detectCapabilities } from '../../src/shelf/capabilities.js'

const ok = { webgl: true, reducedMotion: false, saveData: false, deviceMemory: 8, cores: 8 }

describe('shouldUse3D', () => {
  it('is true for a capable device', () => {
    expect(shouldUse3D(ok)).toBe(true)
  })
  it.each([
    ['no webgl', { webgl: false }],
    ['reduced motion', { reducedMotion: true }],
    ['save data', { saveData: true }],
    ['low memory', { deviceMemory: 2 }],
    ['few cores', { cores: 2 }],
  ])('is false with %s', (_n, patch) => {
    expect(shouldUse3D({ ...ok, ...patch })).toBe(false)
  })
  it('treats undefined memory and cores as capable', () => {
    expect(shouldUse3D({ ...ok, deviceMemory: undefined, cores: undefined })).toBe(true)
  })
})

describe('detectCapabilities', () => {
  it('reads the window and reports no webgl under jsdom', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const caps = detectCapabilities(window)
    spy.mockRestore()
    expect(caps.webgl).toBe(false)
    expect(typeof caps.reducedMotion).toBe('boolean')
    expect(typeof caps.saveData).toBe('boolean')
  })
  it('releases the probe context after checking', () => {
    const lose = vi.fn()
    const gl = { getExtension: (n) => (n === 'WEBGL_lose_context' ? { loseContext: lose } : null) }
    const win = {
      matchMedia: () => ({ matches: false }),
      navigator: {},
      document: { createElement: () => ({ getContext: () => gl }) },
    }
    expect(detectCapabilities(win).webgl).toBe(true)
    expect(lose).toHaveBeenCalledTimes(1)
  })
  it('reads media query, connection, memory and cores from a fake window', () => {
    const win = {
      matchMedia: (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' }),
      navigator: { connection: { saveData: true }, deviceMemory: 4, hardwareConcurrency: 6 },
      document: { createElement: () => ({ getContext: (k) => (k === 'webgl' ? {} : null) }) },
    }
    expect(detectCapabilities(win)).toEqual({
      webgl: true, reducedMotion: true, saveData: true, deviceMemory: 4, cores: 6,
    })
  })
})
