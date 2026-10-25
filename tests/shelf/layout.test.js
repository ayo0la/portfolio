import { describe, it, expect } from 'vitest'
import { layoutFor, homePose, clampPan, faceQuad, quadMatrix3d, openTarget } from '../../src/shelf/three/layout.js'
import { PerspectiveCamera, Vector3 } from 'three'
import { approach, RATES } from '../../src/shelf/three/easing.js'
import { stepMix } from '../../src/shelf/three/useDayNight.js'

describe('layoutFor', () => {
  it('desktop: 2 rows of 4 with the mockup camera and open pose', () => {
    const l = layoutFor(1440)
    expect(l.mode).toBe('desktop')
    expect(l.rows).toBe(2)
    expect(l.perRow).toBe(4)
    expect(l.camera).toEqual({ position: [0, 2.0, 8.2], fov: 32, lookAt: [0, 0.85, 0] })
    expect(l.openPose).toEqual({ position: [1.25, 0.55, 3.9], rotationY: -0.18 })
  })

  it('phone: 1 row of 8 and the phone open pose', () => {
    const l = layoutFor(390)
    expect(l.mode).toBe('phone')
    expect(l.rows).toBe(1)
    expect(l.perRow).toBe(8)
    expect(l.openPose).toEqual({ position: [0, 0.98, 9.4], rotationY: 0 })
    expect(l.recordSize).toBeGreaterThan(layoutFor(1440).recordSize)
  })

  it('breaks at 700 px', () => {
    expect(layoutFor(699).mode).toBe('phone')
    expect(layoutFor(700).mode).toBe('desktop')
  })
})

describe('homePose', () => {
  it('is deterministic per index', () => {
    for (let i = 0; i < 8; i++) {
      expect(homePose(i, 'desktop')).toEqual(homePose(i, 'desktop'))
      expect(homePose(i, 'phone')).toEqual(homePose(i, 'phone'))
    }
  })

  it('leans between -0.12 and -0.07 rad with x jitter of at most 0.06', () => {
    for (const mode of ['desktop', 'phone']) {
      for (let i = 0; i < 8; i++) {
        const { position, rotation } = homePose(i, mode)
        expect(rotation[0]).toBeGreaterThanOrEqual(-0.12)
        expect(rotation[0]).toBeLessThanOrEqual(-0.07)
        const col = mode === 'desktop' ? i % 4 : i
        const base = mode === 'desktop' ? (col - 1.5) * 1.3 : (col - 3.5) * layoutFor(390).gap
        expect(Math.abs(position[0] - base)).toBeLessThanOrEqual(0.0601)
      }
    }
  })

  it('puts desktop records on two shelves and phone records on one', () => {
    expect(homePose(0, 'desktop').position[1]).toBe(1.55)
    expect(homePose(4, 'desktop').position[1]).toBe(0)
    expect(homePose(5, 'phone').position[1]).toBe(0)
  })
})

describe('clampPan', () => {
  it('keeps the camera between the first and last record', () => {
    const l = layoutFor(390)
    expect(clampPan(100, l)).toBeCloseTo(3.5 * l.gap)
    expect(clampPan(-100, l)).toBe(-clampPan(100, l))
    expect(clampPan(0.3, l)).toBe(0.3)
    expect(clampPan(5, layoutFor(1440))).toBe(0)
  })
})

describe('easing', () => {
  it('approach moves toward the target without overshoot', () => {
    expect(approach(0, 1, 10, 0.05)).toBeCloseTo(0.5)
    expect(approach(0, 1, 10, 1)).toBe(1)
    expect(approach(1, 0, RATES.hoverOut, 0.016)).toBeLessThan(1)
  })
})

describe('stepMix', () => {
  it('advances the day/night mix toward the target and reports movement', () => {
    const st = { mix: 0, target: 1 }
    expect(stepMix(st, 0.25)).toBe(true)
    expect(st.mix).toBeCloseTo(0.1)
    const done = { mix: 1, target: 1 }
    expect(stepMix(done, 0.25)).toBe(false)
  })
})

describe('phone framing', () => {
  it('looks at the record centre and makes a record 55-65% of a 390x590 canvas', () => {
    const l = layoutFor(390)
    expect(l.camera.lookAt[1]).toBeCloseTo(0.7 * l.recordSize, 1)
    const dist = l.camera.position[2] - 0.2
    const visibleW = 2 * Math.tan((l.camera.fov * Math.PI) / 360) * dist * (390 / 590)
    const frac = l.recordSize / visibleW
    expect(frac).toBeGreaterThanOrEqual(0.55)
    expect(frac).toBeLessThanOrEqual(0.65)
  })
  it('lets the next record peek in at the edge', () => {
    const l = layoutFor(390)
    const dist = l.camera.position[2] - 0.2
    const half = Math.tan((l.camera.fov * Math.PI) / 360) * dist * (390 / 590)
    const nextEdge = l.gap - l.recordSize / 2
    expect(nextEdge).toBeLessThan(half)
    expect(half - nextEdge).toBeGreaterThan(0.1)
  })
  it('keeps the open record in the upper 55% of the canvas', () => {
    const l = layoutFor(390)
    const dist = l.camera.position[2] - l.openPose.position[2]
    const h = 2 * Math.tan((l.camera.fov * Math.PI) / 360) * dist
    const top = l.camera.lookAt[1] + h / 2
    const bottomY = l.openPose.position[1]
    expect((top - bottomY) / h).toBeLessThanOrEqual(0.55)
    expect(bottomY + l.recordSize * l.openScale).toBeLessThanOrEqual(top)
  })
  it('steps the flipped record toward the camera, never past it', () => {
    for (const w of [1440, 390]) {
      const l = layoutFor(w)
      expect(l.flipLift).toBeGreaterThan(0)
      expect(l.openPose.position[2] + l.flipLift).toBeLessThan(l.camera.position[2] - 2)
    }
  })
})

describe('faceQuad and quadMatrix3d', () => {
  const size = { width: 1440, height: 900 }
  const desktop = layoutFor(1440)
  const phone = layoutFor(390)
  const phoneSize = { width: 390, height: 590 }

  it('puts the open desktop face right of centre, inside the canvas', () => {
    const q = faceQuad(desktop, size, { flipped: false })
    expect(q).toHaveLength(4)
    for (const [x, y] of q) {
      expect(x).toBeGreaterThan(size.width / 2)
      expect(x).toBeLessThan(size.width)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(size.height)
    }
    // top left, top right, bottom right, bottom left
    expect(q[1][0]).toBeGreaterThan(q[0][0])
    expect(q[3][1]).toBeGreaterThan(q[0][1])
  })

  it('keeps the flipped desktop back face inside the canvas and larger than the front', () => {
    const f = faceQuad(desktop, size, { flipped: true })
    const o = faceQuad(desktop, size, { flipped: false })
    for (const [x, y] of f) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThanOrEqual(size.width)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThanOrEqual(size.height)
    }
    expect(f[1][0] - f[0][0]).toBeGreaterThan(o[1][0] - o[0][0])
  })

  it('centres the phone face on the pan target and keeps the flipped face on the canvas', () => {
    for (const flipped of [false, true]) {
      const q = faceQuad(phone, phoneSize, { flipped, panX: 3.5 })
      const cx = q.reduce((a, p) => a + p[0], 0) / 4
      expect(Math.abs(cx - phoneSize.width / 2)).toBeLessThan(2)
      for (const [x, y] of q) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(phoneSize.width)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(phoneSize.height)
      }
    }
  })

  it('builds a matrix that maps the element corners onto the quad', () => {
    const q = [[100, 50], [460, 70], [440, 430], [90, 400]]
    const m = quadMatrix3d(q, 400, 400)
    const apply = (px, py) => {
      const w = m[3] * px + m[7] * py + m[15]
      return [(m[0] * px + m[4] * py + m[12]) / w, (m[1] * px + m[5] * py + m[13]) / w]
    }
    const corners = [[0, 0], [400, 0], [400, 400], [0, 400]]
    corners.forEach(([px, py], i) => {
      const [x, y] = apply(px, py)
      expect(x).toBeCloseTo(q[i][0], 3)
      expect(y).toBeCloseTo(q[i][1], 3)
    })
  })

  it('matches three Vector3.project through a real PerspectiveCamera (desktop and phone, front and flipped)', () => {
    const cases = [
      [desktop, size, 0], [phone, phoneSize, 0], [phone, phoneSize, 3.5],
    ]
    for (const [l, sz, panX] of cases) {
      for (const flipped of [false, true]) {
        const cam = new PerspectiveCamera(l.camera.fov, sz.width / sz.height, 0.1, 100)
        const cx = l.mode === 'phone' ? panX : 0
        cam.position.set(cx, l.camera.position[1], l.camera.position[2])
        cam.lookAt(cx, l.camera.lookAt[1], l.camera.lookAt[2])
        cam.updateMatrixWorld()
        const t = openTarget(l, flipped ? 1 : 0, panX)
        const s = l.recordSize * l.openScale
        const z = flipped ? -0.0165 : 0.0165
        const xs = flipped ? [0.5, -0.5] : [-0.5, 0.5]
        const locals = [[xs[0], 1], [xs[1], 1], [xs[1], 0], [xs[0], 0]]
        const got = faceQuad(l, sz, { flipped, panX })
        locals.forEach(([lx, ly], i) => {
          const c = Math.cos(t.rotationY)
          const sn = Math.sin(t.rotationY)
          const v = new Vector3(
            t.position[0] + lx * s * c + z * sn,
            t.position[1] + ly * s,
            t.position[2] - lx * s * sn + z * c,
          ).project(cam)
          expect(got[i][0]).toBeCloseTo((v.x * 0.5 + 0.5) * sz.width, 1)
          expect(got[i][1]).toBeCloseTo((0.5 - v.y * 0.5) * sz.height, 1)
        })
      }
    }
  })

  it('leaves a gap of at least 12px between the flipped phone face and the collapsed sheet', () => {
    const SHEET_TOP_FROM_BOTTOM = 12 + 132 // bottom inset plus the collapsed sheet height
    const q = faceQuad(phone, phoneSize, { flipped: true, panX: 0 })
    const bottom = Math.max(...q.map((p) => p[1]))
    expect(phoneSize.height - SHEET_TOP_FROM_BOTTOM - bottom).toBeGreaterThanOrEqual(12)
  })
})
