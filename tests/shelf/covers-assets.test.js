import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { blankFraction, BLANK_LIMIT } from '../../scripts/blank-fraction.js'
import { PROJECTS } from '../../src/shelf/projects.js'

const pub = path.resolve(import.meta.dirname, '../../public')
const covers = PROJECTS.map((p) => p.cover)
const entries = covers.flatMap((c) => (c.sites ? c.sites : [c])).filter((c) => c.still || c.tall)

describe('cover assets', () => {
  it('every still and tall path exists under public/', () => {
    const missing = []
    for (const c of entries) for (const k of ['still', 'tall']) {
      if (c[k] && !fs.existsSync(path.join(pub, c[k]))) missing.push(c[k])
    }
    expect(missing).toEqual([])
  })

  it('public/covers/live is at most 2.5 MB', () => {
    const dir = path.join(pub, 'covers/live')
    const total = fs.existsSync(dir)
      ? fs.readdirSync(dir).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0)
      : 0
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThanOrEqual(2.5 * 1024 * 1024)
  })

  it('every tall image is 512 px wide', async () => {
    const talls = entries.map((c) => c.tall).filter(Boolean)
    expect(talls.length).toBe(8)
    for (const t of talls) {
      const meta = await sharp(path.join(pub, t)).metadata()
      expect(meta.width, t).toBe(512)
    }
  })

  it('no tall image is mostly blank', async () => {
    const dir = path.join(pub, 'covers/live')
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('-tall.webp'))) {
      expect(await blankFraction(path.join(dir, f)), f).toBeLessThan(BLANK_LIMIT)
    }
  })
})
