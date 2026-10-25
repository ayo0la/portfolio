import { describe, it, expect } from 'vitest'
import { MOTION, entryDelay, faceReady, rateFor, stepSpring, entrySpring } from '../../src/shelf/motion.js'
import { RATES, approach } from '../../src/shelf/three/easing.js'
import { nextMix } from '../../src/shelf/daynight.js'

describe('MOTION', () => {
  it('holds the spec section 11 values', () => {
    expect(MOTION.entryStagger).toBe(0.06)
    expect(MOTION.entryDuration).toBe(0.6)
    expect(MOTION.hoverIn).toBe(0.25)
    expect(MOTION.hoverOut).toBe(0.35)
    expect(MOTION.hoverTipRad).toBeGreaterThanOrEqual(0.1)
    expect(MOTION.hoverTipRad).toBeLessThanOrEqual(0.14)
    expect(MOTION.openDuration).toBe(0.7)
    expect(MOTION.closeDuration).toBe(0.5)
    expect(MOTION.flipDuration).toBe(0.6)
    expect(MOTION.panelTextDelay).toBe(0.12)
    expect(MOTION.nextOverlap).toBe(0.4)
    expect(MOTION.dayNightDuration).toBe(2.5)
  })
  it('staggers the entry left to right', () => {
    expect(entryDelay(0)).toBe(0)
    expect(entryDelay(3)).toBe(0.18)
  })
})

describe('rates derive from durations', () => {
  it('a 1% settle lands on the duration', () => {
    expect(rateFor(0.5)).toBeCloseTo(Math.log(100) / 0.5, 6)
    expect(RATES.hoverIn).toBeGreaterThan(RATES.hoverOut)
    expect(RATES.openOut).toBeCloseTo(rateFor(MOTION.closeDuration), 6)
    expect(RATES.flip).toBeCloseTo(rateFor(MOTION.flipDuration), 6)
  })
  it('the close approach never overshoots', () => {
    let x = 1
    for (let i = 0; i < 120; i++) { x = approach(x, 0, RATES.openOut, 1 / 60); expect(x).toBeGreaterThanOrEqual(0) }
    expect(x).toBeLessThan(0.001)
  })
})

describe('open spring', () => {
  const run = (seconds) => {
    const s = { x: 0, v: 0 }
    let peak = 0
    for (let t = 0; t < seconds; t += 1 / 60) { stepSpring(s, 1, 1 / 60); peak = Math.max(peak, s.x) }
    return { s, peak }
  }
  it('overshoots slightly and settles near the open duration', () => {
    const { s, peak } = run(1.2)
    expect(peak).toBeGreaterThan(1.01)
    expect(peak).toBeLessThan(1.1)
    expect(Math.abs(s.x - 1)).toBeLessThan(0.01)
  })
  it('is stable at the dt clamp', () => {
    const s = { x: 0, v: 0 }
    for (let i = 0; i < 100; i++) stepSpring(s, 1, 0.05)
    expect(s.x).toBeCloseTo(1, 2)
  })
})

describe('entry spring', () => {
  it('is 0 before the start, rocks past 1, and ends at 1', () => {
    expect(entrySpring(-1)).toBe(0)
    expect(entrySpring(0)).toBe(0)
    let peak = 0
    for (let t = 0; t <= MOTION.entryDuration; t += 0.01) peak = Math.max(peak, entrySpring(t))
    expect(peak).toBeGreaterThan(1)
    expect(entrySpring(MOTION.entryDuration * 2)).toBe(1)
  })
})

describe('day/night uses MOTION', () => {
  it('crosses the whole range in dayNightDuration', () => {
    let m = 0
    for (let i = 0; i < 150; i++) m = nextMix(m, 1, 1 / 60)
    expect(m).toBe(1)
    expect(nextMix(0, 1, 1 / 60)).toBeCloseTo(1 / 60 / MOTION.dayNightDuration, 10)
  })
})

describe('faceReady', () => {
  const base = { isOpen: true, delay: 0, open: { x: 1, v: 0 }, flip: 0, wantFlip: 0, panSettled: true }
  it('is ready only at rest', () => {
    expect(faceReady(base)).toBe(true)
  })
  it('waits out the open spring overshoot', () => {
    expect(faceReady({ ...base, open: { x: 1.042, v: 0 } })).toBe(false)
    expect(faceReady({ ...base, open: { x: 1.005, v: 0.4 } })).toBe(false)
    expect(faceReady({ ...base, open: { x: 0.95, v: 0 } })).toBe(false)
  })
  it('waits for delay, flip, pan and open', () => {
    expect(faceReady({ ...base, delay: 0.1 })).toBe(false)
    expect(faceReady({ ...base, flip: 0.5, wantFlip: 1 })).toBe(false)
    expect(faceReady({ ...base, flip: 0.97, wantFlip: 1 })).toBe(true)
    expect(faceReady({ ...base, panSettled: false })).toBe(false)
    expect(faceReady({ ...base, isOpen: false })).toBe(false)
  })
  it('the real spring is ready only after its peak', () => {
    const s = { x: 0, v: 0 }
    let t = 0, first = null, peakAt = 0, peak = 0
    for (; t < 3; t += 1 / 60) {
      stepSpring(s, 1, 1 / 60)
      if (s.x > peak) { peak = s.x; peakAt = t }
      if (first === null && faceReady({ ...base, open: s })) first = t
    }
    expect(first).toBeGreaterThan(peakAt)
  })
})

describe('indicator state and nearest record', () => {
  it('shows chevrons for what is reachable, so the last record is not a dead end', async () => {
    const { indicatorState, nearestIndex } = await import('../../src/shelf/panIndex.js')
    const { layoutFor, panFor } = await import('../../src/shelf/three/layout.js')
    expect(indicatorState(0, 8)).toEqual({ label: '1 / 8 · Swipe', back: false, forward: true })
    expect(indicatorState(3, 8)).toEqual({ label: '4 / 8 · Swipe', back: true, forward: true })
    expect(indicatorState(7, 8)).toEqual({ label: '8 / 8 · Swipe', back: true, forward: false })
    const phone = layoutFor(390)
    for (const i of [0, 3, 7]) expect(nearestIndex(panFor(i, phone), phone, 8)).toBe(i)
    expect(nearestIndex(panFor(2, phone) + 0.1, phone, 8)).toBe(2)
  })
})
