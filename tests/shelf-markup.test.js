import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const TILE_IDS = [
  'squarea-card', 'oss-card', 'allstar-card', 'npm-card',
  'matchday-card', 'mathtrail-card', 'chess-card', 'client-card',
]

// Cards whose live site opens from the OPEN pill on the back face
const OPEN_URLS = {
  'squarea-card': 'https://app.squarea.agency',
  'allstar-card': 'https://allstarkids-marketing.vercel.app',
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

  it.each(TILE_IDS)('%s is a flippable button card', (id) => {
    const el = doc.getElementById(id)
    expect(el).not.toBeNull()
    expect(el.classList.contains('shelf-card')).toBe(true)
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('data-flipped')).toBe('false')
  })

  it.each(TILE_IDS)('%s has a front and a back face inside a flipper', (id) => {
    const el = doc.getElementById(id)
    expect(el.querySelector('.flipper .face-front')).not.toBeNull()
    expect(el.querySelector('.flipper .face-back')).not.toBeNull()
  })

  it.each(TILE_IDS)('%s lists at least three tracks on the back', (id) => {
    expect(doc.getElementById(id).querySelectorAll('.face-back .track').length).toBeGreaterThanOrEqual(3)
  })

  it.each(Object.entries(OPEN_URLS))('%s opens %s from the back face', (id, url) => {
    const open = doc.getElementById(id).querySelector(`.face-back a[href="${url}"]`)
    expect(open).not.toBeNull()
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

  it('keeps npm download tracks with data-npm-pkg attributes', () => {
    expect(doc.querySelectorAll('#projects [data-npm-pkg]').length).toBeGreaterThanOrEqual(3)
  })

  it('gives every cover a sticker badge', () => {
    for (const id of TILE_IDS) {
      expect(doc.getElementById(id).querySelector('.cover-sticker')).not.toBeNull()
    }
  })

  it('only the client-sites fan uses screenshots; the rest are generative art', () => {
    const fanImgs = doc.querySelectorAll('#client-card .face-front img')
    expect(fanImgs.length).toBe(4)
    for (const img of fanImgs) {
      expect(existsSync(join(root, 'public', img.getAttribute('src').replace(/^\//, '')))).toBe(true)
    }
    for (const id of TILE_IDS.filter(t => t !== 'client-card')) {
      const front = doc.getElementById(id).querySelector('.face-front')
      expect(front.querySelector('img'), `${id} has no screenshot`).toBeNull()
      expect(front.classList.contains('cover-gen'), `${id} is generative`).toBe(true)
      expect(front.querySelector('.cover-motif'), `${id} has motif art`).not.toBeNull()
    }
  })

  it('marks every cover image lazy and alt-texted', () => {
    for (const img of doc.querySelectorAll('#projects .face-front img')) {
      expect(img.getAttribute('loading')).toBe('lazy')
      expect(img.getAttribute('alt')).toBeTruthy()
    }
  })

  it('has no MDFLD text watermark in the flagship section', () => {
    expect(doc.querySelector('.mdfld-bg-word')).toBeNull()
  })

  it('uses the MDFLD logo as the flagship watermark, gold via CSS mask', () => {
    const logo = doc.querySelector('#mdfld .mdfld-bg-logo')
    expect(logo).not.toBeNull()
    expect(logo.tagName).toBe('DIV')
    expect(logo.getAttribute('aria-hidden')).toBe('true')
    expect(existsSync(join(root, 'public', 'mdfld-logo.png'))).toBe(true)
    const css = readFileSync(join(root, 'src', 'style.css'), 'utf8')
    const rule = css.slice(css.indexOf('.mdfld-bg-logo'))
    expect(rule.slice(0, rule.indexOf('}'))).toContain('mask-image')
    expect(rule.slice(0, rule.indexOf('}'))).toContain('--gold')
  })

  it('ships a playable chess board shell on the chess cover', () => {
    const play = doc.querySelector('#chess-card .face-front .chess-play')
    expect(play).not.toBeNull()
    expect(play.querySelector('.chess-board')).not.toBeNull()
    expect(play.querySelector('.chess-status')).not.toBeNull()
    expect(play.querySelector('.chess-reset')).not.toBeNull()
  })
})
