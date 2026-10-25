import { describe, it, expect } from 'vitest'
import { BoxGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  poseChanged, repaintDue, REPAINT_INTERVAL, DPR_TIERS, startTier, stepTier, createFrameWindow, mergeSleeveGroups, sunShadowOn, nextTier, withShadowFlagPreserved, contactRefreshDue,
} from '../../src/shelf/perf.js'

describe('poseChanged (shadow map update predicate)', () => {
  const a = [0, 1, 2, 0, 0, 0, 1, 1]
  it('is false for an identical pose', () => {
    expect(poseChanged(a, [...a])).toBe(false)
  })
  it('is true when position, rotation or scale moves', () => {
    expect(poseChanged(a, [0.01, 1, 2, 0, 0, 0, 1, 1])).toBe(true)
    expect(poseChanged(a, [0, 1, 2, 0, 0, 0.01, 1, 1])).toBe(true)
    expect(poseChanged(a, [0, 1, 2, 0, 0, 0, 1, 1.01])).toBe(true)
  })
  it('ignores sub-epsilon jitter', () => {
    expect(poseChanged(a, [1e-7, 1, 2, 0, 0, 0, 1, 1])).toBe(false)
  })
  it('is true when there is no previous pose', () => {
    expect(poseChanged(null, a)).toBe(true)
  })
})

describe('repaintDue (cover playback throttle)', () => {
  it('caps playback repaints at 30 per second', () => {
    expect(REPAINT_INTERVAL).toBeCloseTo(1 / 30, 5)
  })
  it('is due only once the interval has elapsed', () => {
    expect(repaintDue(0.1, 0.1 + 0.01)).toBe(false)
    expect(repaintDue(0.1, 0.1 + REPAINT_INTERVAL)).toBe(true)
    expect(repaintDue(null, 5)).toBe(true)
  })
  it('allows a little slack so 60 Hz frames land on every second tick', () => {
    expect(repaintDue(0, 1 / 60)).toBe(false)
    expect(repaintDue(0, 2 / 60 - 0.001)).toBe(true)
  })
})

describe('DPR tiers', () => {
  it('ends at the spec caps', () => {
    expect(DPR_TIERS.desktop.at(-1)).toBe(1.75)
    expect(DPR_TIERS.phone.at(-1)).toBe(1.5)
  })
  it('starts desktop at 1.25 and phone at 1.25 or lower', () => {
    expect(DPR_TIERS.desktop[startTier()]).toBe(1.25)
    expect(DPR_TIERS.phone[startTier()]).toBeLessThanOrEqual(1.25)
  })
  it('steps up when frames are consistently fast and down when slow', () => {
    const i = startTier()
    expect(stepTier('desktop', i, 12)).toBe(i + 1)
    expect(stepTier('desktop', i, 70)).toBe(i - 1)
    expect(stepTier('desktop', i, 33)).toBe(i)
  })
  it('never leaves the tier range', () => {
    const top = DPR_TIERS.desktop.length - 1
    expect(stepTier('desktop', top, 5)).toBe(top)
    expect(stepTier('desktop', 0, 200)).toBe(0)
  })
})

describe('createFrameWindow', () => {
  it('averages sustained frames and reports once per window', () => {
    const w = createFrameWindow(4)
    expect(w.push(0.016)).toBeNull()
    expect(w.push(0.016)).toBeNull()
    expect(w.push(0.016)).toBeNull()
    expect(w.push(0.016)).toBeCloseTo(16, 3)
  })
  it('resets on an idle gap so sleeping never reads as slow', () => {
    const w = createFrameWindow(3)
    w.push(0.016); w.push(0.016)
    expect(w.push(2)).toBeNull()
    expect(w.push(0.016)).toBeNull()
    expect(w.push(0.016)).toBeNull()
    expect(w.push(0.016)).toBeCloseTo(16, 3)
  })
})

describe('mergeSleeveGroups', () => {
  it('collapses six face groups into the sleeve and the front, keeping every index', () => {
    const g = new BoxGeometry(1, 1, 0.1, 2, 2, 2)
    const total = g.index.count
    const front = g.groups[4].count
    mergeSleeveGroups(g)
    expect(g.groups).toHaveLength(2)
    expect(g.groups[0].materialIndex).toBe(0)
    expect(g.groups[1].materialIndex).toBe(1)
    expect(g.groups[1].count).toBe(front)
    expect(g.groups[0].count + g.groups[1].count).toBe(total)
    expect(g.index.count).toBe(total)
  })
})

describe('mergeSleeveGroups on the real (non-indexed) record geometry', () => {
  it('keeps every vertex and puts the front face in group 1', () => {
    const g = new RoundedBoxGeometry(1, 1, 0.03, 2, 0.006)
    const verts = g.attributes.position.count
    const front = g.groups[4].count
    mergeSleeveGroups(g)
    expect(g.groups).toHaveLength(2)
    expect(g.groups[1].count).toBe(front)
    expect(g.groups[0].count + g.groups[1].count).toBe(verts)
    // the front face points at +z
    const n = g.attributes.normal
    const mean = (from, to) => { let s = 0; for (let i = from; i < to; i++) s += n.getZ(i); return s / (to - from) }
    expect(mean(g.groups[1].start, verts)).toBeGreaterThan(0.7)
    expect(mean(0, g.groups[0].count)).toBeLessThan(0.3)
  })
})

describe('sunShadowOn', () => {
  it('turns the sun shadow off at night and on in daylight', () => {
    expect(sunShadowOn(0)).toBe(false)
    expect(sunShadowOn(0.005)).toBe(false)
    expect(sunShadowOn(0.2)).toBe(true)
    expect(sunShadowOn(1)).toBe(true)
  })
})

describe('nextTier (never climb after a drop)', () => {
  it('climbs while no drop has happened', () => {
    expect(nextTier('desktop', 1, 10, 0)).toEqual({ tier: 2, drops: 0 })
  })
  it('counts drops', () => {
    expect(nextTier('desktop', 2, 80, 0)).toEqual({ tier: 1, drops: 1 })
  })
  it('refuses to climb once a drop happened', () => {
    expect(nextTier('desktop', 1, 10, 1)).toEqual({ tier: 1, drops: 1 })
  })
})

describe('contact shadows on every row', () => {
  // two instances share one shadowMap flag; each one's offscreen render consumes it like gl.render does
  const makeGl = () => {
    const shadowMap = { needsUpdate: true }
    const render = () => { shadowMap.needsUpdate = false } // what shadowMap.render does
    return { shadowMap, render }
  }
  it('lets the second instance see the pending refresh after the first rendered', () => {
    const { shadowMap, render } = makeGl()
    const seen = []
    for (let row = 0; row < 2; row++) {
      if (contactRefreshDue(shadowMap.needsUpdate, false)) {
        seen.push(row)
        withShadowFlagPreserved(shadowMap, render)
      }
    }
    expect(seen).toEqual([0, 1])
    expect(shadowMap.needsUpdate).toBe(true) // the main render still gets its refresh
  })
  it('leaves a cleared flag cleared', () => {
    const { shadowMap, render } = makeGl()
    shadowMap.needsUpdate = false
    withShadowFlagPreserved(shadowMap, render)
    expect(shadowMap.needsUpdate).toBe(false)
  })
  it('refreshes on the first frame without a pending flag', () => {
    expect(contactRefreshDue(false, true)).toBe(true)
    expect(contactRefreshDue(false, false)).toBe(false)
  })
})
