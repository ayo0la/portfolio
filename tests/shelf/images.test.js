import { describe, it, expect, vi } from 'vitest'
import { usable, whenDecoded } from '../../src/shelf/covers/images.js'
import { drawCover } from '../../src/shelf/covers/draw.js'
import { projectBySlug } from '../../src/shelf/projects.js'
import { makeCtx } from './fake-ctx.js'

const broken = { complete: true, naturalWidth: 0, naturalHeight: 0 }
const good = { complete: true, naturalWidth: 390, naturalHeight: 1688 }

describe('usable', () => {
  it('rejects null, incomplete and zero-width images', () => {
    expect(usable(null)).toBe(false)
    expect(usable({ complete: false, naturalWidth: 10 })).toBe(false)
    expect(usable(broken)).toBe(false)
    expect(usable(good)).toBe(true)
  })
})

describe('broken images never reach drawImage', () => {
  const still = { t: 0, playing: false, data: {} }
  it('fan skips an image with naturalWidth 0', () => {
    const ctx = makeCtx()
    drawCover(ctx, projectBySlug('client-sites'), { ...still, images: { sites: [broken, broken, good, broken] } })
    expect(ctx.calls.filter((c) => c[0] === 'drawImage')).toHaveLength(1)
  })
  it('scroll skips an image with naturalWidth 0', () => {
    const ctx = makeCtx()
    drawCover(ctx, projectBySlug('square-a'), { ...still, playing: true, images: { tall: broken } })
    expect(ctx.calls.some((c) => c[0] === 'drawImage')).toBe(false)
  })
})

describe('whenDecoded', () => {
  it('calls back after decode() resolves, not before', async () => {
    let resolve
    const img = { decode: () => new Promise((r) => { resolve = r }) }
    const cb = vi.fn()
    whenDecoded(img, cb)
    expect(cb).not.toHaveBeenCalled()
    resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(cb).toHaveBeenCalledTimes(1)
  })
  it('still calls back when decode() rejects (callers re-check usable)', async () => {
    const img = { decode: () => Promise.reject(new Error('bad')) }
    const cb = vi.fn()
    whenDecoded(img, cb)
    await new Promise((r) => setTimeout(r, 0))
    expect(cb).toHaveBeenCalledTimes(1)
  })
  it('calls back immediately without decode()', () => {
    const cb = vi.fn()
    whenDecoded({}, cb)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
