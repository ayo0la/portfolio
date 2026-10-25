import { describe, it, expect } from 'vitest'
import { PROJECTS, projectBySlug } from '../../src/shelf/projects.js'

const PITCHES = {
  'square-a': 'The operations platform childcare centers run on, with a human approving every message it sends.',
  upstream: 'Five merged fixes in computer vision libraries with 62,000+ combined stars.',
  'allstar-kids': 'Enrollment and records for a licensed childcare center in Decatur, GA, moved from paper to phones.',
  npm: 'Three small packages I published for grain, cursors, and scroll animation.',
  matchday: 'Live scores, standings, and fixtures for six competitions on one board.',
  'math-trail': 'Adaptive math practice with 296 free-response lessons and no multiple choice.',
  'chess-rivals': 'Real-time multiplayer chess with matches that persist between sessions.',
  'client-sites': 'Four sites for an athlete, an economist, a muralist, and a roofer.',
}

const LINKS = {
  'square-a': 'https://app.squarea.agency',
  'allstar-kids': 'https://allstarkids-marketing.vercel.app',
  matchday: 'https://matchday-sooty.vercel.app',
  'math-trail': 'https://math-trail-sigma.vercel.app',
  'chess-rivals': 'https://chessdotcom-idea.vercel.app',
  upstream: 'https://github.com/ayo0la',
  npm: 'https://www.npmjs.com/~ayo0la',
}

const MERGED = [
  'https://github.com/roboflow/supervision/pull/2479',
  'https://github.com/roboflow/supervision/pull/2558',
  'https://github.com/roboflow/supervision/pull/2559',
  'https://github.com/roboflow/rf-detr/pull/1325',
  'https://github.com/imageio/imageio/pull/1208',
]

function strings(v, out = []) {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out))
  return out
}

describe('shelf project data', () => {
  it('has 8 projects in order with ids', () => {
    expect(PROJECTS.map((p) => [p.slug, p.cardId])).toEqual([
      ['square-a', 'squarea-card'],
      ['upstream', 'oss-card'],
      ['allstar-kids', 'allstar-card'],
      ['npm', 'npm-card'],
      ['matchday', 'matchday-card'],
      ['math-trail', 'mathtrail-card'],
      ['chess-rivals', 'chess-card'],
      ['client-sites', 'client-card'],
    ])
    const slugs = PROJECTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(8)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
  })

  it('has required fields', () => {
    for (const p of PROJECTS) {
      for (const k of ['name', 'category', 'tag', 'pitch', 'blurb']) {
        expect(typeof p[k], `${p.slug}.${k}`).toBe('string')
        expect(p[k].length, `${p.slug}.${k}`).toBeGreaterThan(0)
      }
      expect(p.year).toBe(2026)
      expect(p.tracks.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('uses the approved pitches', () => {
    for (const p of PROJECTS) expect(p.pitch).toBe(PITCHES[p.slug])
  })

  it('has footer links', () => {
    for (const [slug, href] of Object.entries(LINKS)) {
      expect(projectBySlug(slug).link.href).toBe(href)
    }
    expect(projectBySlug('client-sites').link).toBeUndefined()
  })

  it('upstream lists the merged PRs only', () => {
    const t = projectBySlug('upstream').tracks
    expect(t.map((x) => x.href)).toEqual(MERGED)
    for (const x of t) expect(x.meta).toMatch(/merged/i)
    expect(JSON.stringify(t)).not.toContain('hiring-agent')
  })

  it('npm tracks carry package names', () => {
    expect(projectBySlug('npm').tracks.map((t) => t.npmPkg)).toEqual([
      '@ayo0la/grain-canvas',
      '@ayo0la/cursor',
      '@ayo0la/scroll-animations',
    ])
  })

  it('client-sites hrefs and fan covers', () => {
    const p = projectBySlug('client-sites')
    const hrefs = p.tracks.map((t) => t.href)
    for (const h of ['dryco-roofing', 'dolapo-portfolio-tau', 'akinmorakinyo', 'kayla-bloom-portfolio']) {
      expect(hrefs).toContain(`https://${h}.vercel.app`)
    }
    expect(p.cover.kind).toBe('fan')
    expect(p.cover.sites.map((s) => s.still)).toEqual(
      ['dryco', 'akin', 'dolapo', 'kayla'].map((n) => `/covers/${n}.jpg`),
    )
  })

  it('scroll covers point at live captures', () => {
    for (const s of ['square-a', 'allstar-kids', 'matchday', 'math-trail']) {
      expect(projectBySlug(s).cover).toEqual({
        kind: 'scroll',
        still: `/covers/live/${s}.webp`,
        tall: `/covers/live/${s}-tall.webp`,
      })
    }
  })

  it('contains no em dash', () => {
    for (const s of strings(PROJECTS)) expect(s).not.toContain('—')
  })

  it('looks up by slug', () => {
    expect(projectBySlug('chess-rivals').name).toBe('Chess Rivals')
    expect(projectBySlug('nope')).toBeUndefined()
  })
})
