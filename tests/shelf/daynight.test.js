import { describe, it, expect } from 'vitest'
import { PALETTES, blendRoom, targetFor, nextMix } from '../../src/shelf/daynight.js'

describe('PALETTES', () => {
  it('holds the exact night and day values', () => {
    expect(PALETTES.night).toEqual({
      bg: '#121110', wall: '#1a1917', shelf: '#22201d', edge: '#e8b931', edgeEmissive: '#6b4f0c',
      key: '#ffd9a0', keyIntensity: 104, ambient: 0.18, env: 0.25, coverEmissive: 0.32, coverDiffuse: 0.45, sun: 0,
    })
    expect(PALETTES.day).toEqual({
      bg: '#a89a83', wall: '#ae9f86', shelf: '#3a2c20', edge: '#f3d9a4', edgeEmissive: '#000000',
      key: '#fff6e8', keyIntensity: 14, ambient: 0.28, env: 0.4, coverEmissive: 0.5, coverDiffuse: 0.38, sun: 240,
    })
  })
})

describe('blendRoom', () => {
  it('returns the palettes at the ends', () => {
    expect(blendRoom(0)).toEqual(PALETTES.night)
    expect(blendRoom(1)).toEqual(PALETTES.day)
  })
  it('blends colors channel-wise at the midpoint', () => {
    // wall: 1a1917 and ae9f86 -> (26+174)/2=100, (25+159)/2=92, (23+134)/2=78.5 -> 79
    expect(blendRoom(0.5).wall).toBe('#645c4f')
  })
  it('blends numbers linearly', () => {
    const m = blendRoom(0.5)
    expect(m.keyIntensity).toBe(59)
    expect(m.sun).toBe(120)
    expect(m.coverDiffuse).toBeCloseTo(0.415, 10)
  })
  it('clamps t outside 0..1', () => {
    expect(blendRoom(-1)).toEqual(PALETTES.night)
    expect(blendRoom(2)).toEqual(PALETTES.day)
  })
  it('returns lowercase #rrggbb', () => {
    for (const k of ['bg', 'wall', 'shelf', 'edge', 'edgeEmissive', 'key']) {
      expect(blendRoom(0.37)[k]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('targetFor', () => {
  it('maps prefersDark to night (0) and light to day (1)', () => {
    expect(targetFor(true)).toBe(0)
    expect(targetFor(false)).toBe(1)
  })
})

describe('nextMix', () => {
  it('moves toward the target by dt/duration', () => {
    expect(nextMix(0, 1, 0.5)).toBeCloseTo(0.2, 10)
  })
  it('never overshoots', () => {
    expect(nextMix(0.95, 1, 1)).toBe(1)
    expect(nextMix(0.05, 0, 1)).toBe(0)
  })
  it('moves down too', () => {
    expect(nextMix(1, 0, 0.5)).toBeCloseTo(0.8, 10)
  })
  it('continues from the current mix when the target changes mid-blend', () => {
    const mid = nextMix(0, 1, 1.25)
    expect(mid).toBeCloseTo(0.5, 10)
    expect(nextMix(mid, 0, 1.25)).toBeCloseTo(0, 10)
    expect(nextMix(mid, 0, 0.5)).toBeCloseTo(0.3, 10)
  })
  it('stays put at the target and honors a custom duration', () => {
    expect(nextMix(1, 1, 0.5)).toBe(1)
    expect(nextMix(0, 1, 0.5, 1)).toBeCloseTo(0.5, 10)
  })
})
