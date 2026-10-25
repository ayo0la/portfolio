import { describe, it, expect } from 'vitest'
import { renderShelfHtml, injectShelf } from '../../scripts/shelf-markup.js'
import { PROJECTS } from '../../src/shelf/projects.js'

const parse = (html) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

describe('renderShelfHtml', () => {
  const doc = parse(renderShelfHtml(PROJECTS))

  it('renders 8 cards in 2 rows of 4', () => {
    expect(doc.querySelectorAll('.shelf-card')).toHaveLength(8)
    const rows = doc.querySelectorAll('.shelf-row')
    expect(rows).toHaveLength(2)
    for (const row of rows) expect(row.querySelectorAll('.shelf-card')).toHaveLength(4)
  })

  it('carries card ids, slugs and the flip contract', () => {
    for (const p of PROJECTS) {
      const card = doc.getElementById(p.cardId)
      expect(card.dataset.slug).toBe(p.slug)
      expect(card.getAttribute('aria-label')).toBe(p.ariaLabel)
      expect(card.dataset.flipped).toBe('false')
      expect(card.querySelector('.flipper .face-front .cover-tag').textContent).toBe(p.tag)
      expect(card.querySelector('.face-front .cover-sticker').textContent).toBe(p.sticker)
      expect(card.querySelector('.face-front .cover-name').textContent).toBe(p.name)
      expect(card.querySelector('.face-front .cover-pill')).not.toBeNull()
    }
  })

  it('keeps every pitch, track href and link href in the static HTML', () => {
    const html = renderShelfHtml(PROJECTS)
    const text = doc.body.textContent
    for (const p of PROJECTS) {
      expect(text + html).toContain(p.pitch)
      for (const t of p.tracks) if (t.href) expect(doc.querySelector(`a.track[href="${t.href}"]`)).not.toBeNull()
      if (p.link) expect(doc.querySelector(`a.back-open[href="${p.link.href}"]`)).not.toBeNull()
    }
  })

  it('opens external links safely and tags npm packages', () => {
    for (const a of doc.querySelectorAll('.face-back a')) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener')
    }
    expect(doc.querySelectorAll('[data-npm-pkg]')).toHaveLength(3)
  })

  it('uses stills for scroll covers, canvases for oss/npm, and keeps the chess board block', () => {
    expect(doc.querySelector('#squarea-card .face-front img.cover-still').getAttribute('src')).toBe('/covers/live/square-a.webp')
    expect(doc.querySelector('#oss-card .face-front canvas.cover-canvas').dataset.cover).toBe('upstream')
    expect(doc.querySelector('#npm-card .face-front canvas.cover-canvas').getAttribute('width')).toBe('512')
    expect(doc.querySelector('#chess-card .face-front .chess-play .chess-board')).not.toBeNull()
    expect(doc.querySelectorAll('#client-card .face-front img.cover-still')).toHaveLength(4)
  })

  it('puts 62K in the oss canvas accessible text', () => {
    const c = doc.querySelector('#oss-card canvas')
    expect(c.getAttribute('aria-label') + c.textContent).toContain('62K')
  })

  it('renders the index row and the 3D mount point', () => {
    const entries = doc.querySelectorAll('.shelf-index [data-target]')
    expect(entries).toHaveLength(8)
    const npm = doc.querySelector('[data-target="npm-card"]')
    expect(npm.querySelector('.sie-name').textContent).toBe('npm ×3')
    expect(npm.querySelector('.sie-cat').textContent).toBe('Open Source')
    expect(npm.querySelector('.sie-year').textContent).toBe('2026')
    expect(doc.querySelector('#shelf-3d[aria-hidden="true"]')).not.toBeNull()
  })

  it('has no em dashes', () => {
    expect(renderShelfHtml(PROJECTS)).not.toContain('—')
  })
})

describe('injectShelf', () => {
  const page = '<html><body><p>before</p><section id="projects"><span>tag</span>\n<!-- shelf:start -->\nOLD\n<!-- shelf:end -->\n</section><p>after</p></body></html>'

  it('replaces only what sits between the markers', () => {
    const out = injectShelf(page, PROJECTS)
    expect(out).not.toContain('OLD')
    expect(out).toContain('<p>before</p><section id="projects"><span>tag</span>')
    expect(out).toContain('</section><p>after</p>')
    expect(out).toContain('id="squarea-card"')
  })

  it('is idempotent', () => {
    const once = injectShelf(page, PROJECTS)
    expect(injectShelf(once, PROJECTS)).toBe(once)
  })

  it('throws when the markers are missing', () => {
    expect(() => injectShelf('<html></html>', PROJECTS)).toThrow()
  })
})

describe('3D scene order', () => {
  it('places the scene after the section tag and before the index row', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/style.css', 'utf8')
    expect(css).toMatch(/\.shelf-3d-active #shelf-3d \{[^}]*order: 1;/)
    expect(css).toMatch(/\.shelf-3d-active \.shelf-index \{ order: 2; \}/)
  })
})
