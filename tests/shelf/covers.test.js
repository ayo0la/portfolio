import { describe, it, expect } from 'vitest'
import { PROJECTS, projectBySlug } from '../../src/shelf/projects.js'
import { drawCover } from '../../src/shelf/covers/draw.js'
import upstream from '../../src/data/upstream.json'
import { makeCtx, texts } from './fake-ctx.js'

const data = { upstream, downloads: {} }
const still = { t: 0, playing: false, images: {}, data }

describe('drawCover stills', () => {
  for (const p of PROJECTS) {
    it(`${p.slug} paints name and tag`, () => {
      const ctx = makeCtx()
      drawCover(ctx, p, still)
      const t = texts(ctx)
      expect(t).toContain(p.name)
      expect(t).toContain(p.tag)
    })
  }
})

describe('oss', () => {
  it('shows upstream numbers', () => {
    const ctx = makeCtx()
    drawCover(ctx, projectBySlug('upstream'), still)
    const t = texts(ctx)
    expect(t).toContain('+502')
    expect(t).toContain('−212')
    expect(t).toContain('5 Merged')
    expect(t).toContain('62K ★')
  })
})

describe('npm', () => {
  const p = projectBySlug('npm')
  it('shows downloads only when finite and positive', () => {
    const ctx = makeCtx()
    drawCover(ctx, p, { ...still, data: { upstream, downloads: { '@ayo0la/cursor': 148, '@ayo0la/grain-canvas': null } } })
    const t = texts(ctx)
    expect(t).toContain('148/wk')
    expect(t.some((s) => /NaN|undefined|^0\/wk/.test(s))).toBe(false)
    expect(t).toContain('cursor')
    expect(t).toContain('grain-canvas')
  })
  it('draws no numbers with empty data', () => {
    const ctx = makeCtx()
    drawCover(ctx, p, still)
    expect(texts(ctx).some((s) => /\/wk/.test(s))).toBe(false)
  })
})

describe('scroll', () => {
  const p = projectBySlug('square-a')
  it('survives a null image and draws the name', () => {
    const ctx = makeCtx()
    drawCover(ctx, p, { ...still, images: { tall: null } })
    expect(texts(ctx)).toContain(p.name)
  })
  it('draws the image at y 0 at t=0', () => {
    const ctx = makeCtx()
    const tall = { naturalWidth: 390, naturalHeight: 1688, complete: true }
    drawCover(ctx, p, { t: 0, playing: true, images: { tall }, data })
    const d = ctx.calls.find((c) => c[0] === 'drawImage')
    expect(d).toBeTruthy()
    expect(d[3]).toBe(0)
  })
})

describe('chess', () => {
  const p = projectBySlug('chess-rivals')
  it('still shows CHECKMATE', () => {
    const ctx = makeCtx()
    drawCover(ctx, p, still)
    expect(texts(ctx)).toContain('CHECKMATE')
    expect(texts(ctx)).toContain('Morphy vs Duke & Count · Paris 1858')
  })
  it('playing at t=0 has no CHECKMATE', () => {
    const ctx = makeCtx()
    drawCover(ctx, p, { ...still, playing: true, t: 0 })
    expect(texts(ctx)).not.toContain('CHECKMATE')
  })
})

describe('fan', () => {
  it('does not throw with missing images', () => {
    const ctx = makeCtx()
    drawCover(ctx, projectBySlug('client-sites'), { ...still, images: { sites: [null, null, null, null] } })
    expect(ctx.calls.some((c) => c[0] === 'drawImage')).toBe(false)
  })
})

describe('label scrim', () => {
  function scrim() {
    const stops = []
    let y0 = 0
    let y1 = 0
    const ctx = makeCtx()
    const real = ctx.createLinearGradient
    ctx.createLinearGradient = (x0, a, x1, b) => { y0 = a; y1 = b; return { addColorStop: (o, c) => stops.push([o, c]) } }
    void real
    drawCover(ctx, projectBySlug('square-a'), still)
    const alpha = (c) => Number(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(c)[1])
    return stops.map(([o, c]) => ({ y: y0 + o * (y1 - y0), a: alpha(c) }))
  }
  it('is clear above the label block and solid behind the tag and name', () => {
    const s = scrim()
    const at = (y) => s.filter((p) => p.y <= y).pop()
    // nothing hidden in the top three quarters of the cover
    expect(s[0].y).toBeGreaterThanOrEqual(340)
    // fully (>= .95) opaque by the top of the tag line, which sits near y=436
    expect(s.find((p) => p.a >= 0.95).y).toBeLessThanOrEqual(436)
    // but still translucent a third of the way up the ramp, so the screenshot reads above it
    expect(at(380).a).toBeLessThan(0.9)
  })
})
