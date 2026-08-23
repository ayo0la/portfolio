import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const TILE_IDS = [
  'squarea-card', 'oss-card', 'allstar-card', 'npm-card',
  'matchday-card', 'mathtrail-card', 'chess-card', 'client-card',
]
const EXPANDABLE_IDS = ['oss-card', 'allstar-card', 'npm-card', 'client-card']
const LINK_TILES = {
  'squarea-card': 'https://app.squarea.agency',
  'matchday-card': 'https://matchday-sooty.vercel.app',
  'mathtrail-card': 'https://math-trail-sigma.vercel.app',
  'chess-card': 'https://chessdotcom-idea.vercel.app',
}

let doc

beforeAll(() => {
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  doc = new DOMParser().parseFromString(html, 'text/html')
})

describe('Other Work shelf markup', () => {
  it('renders exactly eight shelf cards in #projects', () => {
    expect(doc.querySelectorAll('#projects .shelf-card')).toHaveLength(8)
  })

  it.each(TILE_IDS)('has a shelf card with id %s', (id) => {
    const el = doc.getElementById(id)
    expect(el).not.toBeNull()
    expect(el.classList.contains('shelf-card')).toBe(true)
  })

  it.each(EXPANDABLE_IDS)('%s is an expandable button with a details panel', (id) => {
    const el = doc.getElementById(id)
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('data-expanded')).toBe('false')
    expect(el.querySelector('.npm-packages')).not.toBeNull()
  })

  it.each(Object.entries(LINK_TILES))('%s links to %s', (id, url) => {
    const el = doc.getElementById(id)
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('href')).toBe(url)
  })

  it('keeps every shelf card inside a shelf row', () => {
    for (const id of TILE_IDS) {
      expect(doc.getElementById(id).closest('.shelf-row')).not.toBeNull()
    }
  })

  it('has an index entry targeting every tile', () => {
    const targets = [...doc.querySelectorAll('#projects .shelf-index [data-target]')]
      .map(el => el.getAttribute('data-target'))
    expect(targets.sort()).toEqual([...TILE_IDS].sort())
  })

  it('keeps npm download rows with data-npm-pkg attributes', () => {
    expect(doc.querySelectorAll('#projects [data-npm-pkg]').length).toBeGreaterThanOrEqual(3)
  })

  it('ships every screenshot cover referenced from the page', () => {
    const covers = [...doc.querySelectorAll('#projects .cover img')]
      .map(img => img.getAttribute('src'))
    expect(covers.length).toBeGreaterThanOrEqual(6)
    for (const src of covers) {
      expect(existsSync(join(root, 'public', src.replace(/^\//, '')))).toBe(true)
    }
  })

  it('gives every cover a sticker badge', () => {
    for (const id of TILE_IDS) {
      expect(doc.getElementById(id).querySelector('.cover-sticker')).not.toBeNull()
    }
  })

  it('marks every cover image lazy and alt-texted', () => {
    for (const img of doc.querySelectorAll('#projects .cover img')) {
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.getAttribute('alt')).toBeTruthy()
    }
  })
})
