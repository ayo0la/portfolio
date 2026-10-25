import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderShelfHtml } from '../../scripts/shelf-markup.js'
import { PROJECTS } from '../../src/shelf/projects.js'
import { initShelf } from '../../src/shelf/mount.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function capableWin(IO, hash = '') {
  const doc = new Proxy(document, {
    get(t, k) {
      if (k === 'createElement') {
        return (tag) => (tag === 'canvas' ? { getContext: () => ({}) } : document.createElement(tag))
      }
      const v = t[k]
      return typeof v === 'function' ? v.bind(t) : v
    },
  })
  return {
    document: doc,
    navigator: { hardwareConcurrency: 8, deviceMemory: 8 },
    matchMedia: () => ({ matches: false }),
    IntersectionObserver: IO,
    location: { hash },
  }
}

const firesImmediately = class {
  constructor(cb) { this.cb = cb }
  observe(el) { this.cb([{ isIntersecting: true, target: el }]) }
  disconnect() {}
}

// jsdom has no canvas; stub for the whole file so late async paints stay quiet
const realGetContext = HTMLCanvasElement.prototype.getContext
beforeAll(() => { HTMLCanvasElement.prototype.getContext = () => null })
afterAll(() => { HTMLCanvasElement.prototype.getContext = realGetContext })

beforeEach(() => {
  document.body.innerHTML = `<section id="projects">${renderShelfHtml(PROJECTS)}</section>`
})
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

describe('initShelf', () => {
  it('falls back to the 2D shelf when capabilities fail', () => {
    const win = {
      document,
      navigator: { hardwareConcurrency: 8, deviceMemory: 8 },
      matchMedia: () => ({ matches: true }),
    }
    const load = vi.fn()
    expect(initShelf({ win, load })).toEqual({ mode: '2d' })
    expect(load).not.toHaveBeenCalled()
    document.getElementById('npm-card').click()
    expect(document.getElementById('npm-card').dataset.flipped).toBe('true')
  })

  it('mounts the 3D island on first intersection', async () => {
    const mountShelf3D = vi.fn((el) => {
      el.appendChild(document.createElement('canvas'))
      return { unmount: vi.fn() }
    })
    const load = vi.fn(() => Promise.resolve({ mountShelf3D }))
    expect(initShelf({ win: capableWin(firesImmediately), load })).toEqual({ mode: '3d' })
    await vi.waitFor(() => expect(document.getElementById('projects').classList.contains('shelf-3d-active')).toBe(true))
    expect(mountShelf3D).toHaveBeenCalledTimes(1)
    expect(mountShelf3D.mock.calls[0][0]).toBe(document.getElementById('shelf-3d'))
    expect(typeof mountShelf3D.mock.calls[0][1].onContextLost).toBe('function')
  })

  it('observes with a 100% vertical rootMargin', () => {
    const seen = []
    const IO = class { constructor(cb, opts) { seen.push(opts) } observe() {} disconnect() {} }
    initShelf({ win: capableWin(IO), load: vi.fn() })
    expect(seen[0].rootMargin).toBe('100% 0px')
  })

  it('drops back to the 2D shelf when the WebGL context is lost', async () => {
    const unmount = vi.fn()
    const mountShelf3D = vi.fn((el) => {
      el.appendChild(document.createElement('canvas'))
      return { unmount }
    })
    initShelf({ win: capableWin(firesImmediately), load: () => Promise.resolve({ mountShelf3D }) })
    const projects = document.getElementById('projects')
    await vi.waitFor(() => expect(projects.classList.contains('shelf-3d-active')).toBe(true))
    document.querySelector('#shelf-3d canvas').dispatchEvent(new Event('webglcontextlost'))
    expect(projects.classList.contains('shelf-3d-active')).toBe(false)
    expect(unmount).toHaveBeenCalledTimes(1)
    document.getElementById('npm-card').click()
    expect(document.getElementById('npm-card').dataset.flipped).toBe('true')
  })

  it('falls back when the island fails to load', async () => {
    initShelf({ win: capableWin(firesImmediately), load: () => Promise.reject(new Error('chunk')) })
    await vi.waitFor(() => {
      document.getElementById('squarea-card').click()
      expect(document.getElementById('squarea-card').dataset.flipped).toBe('true')
    })
    expect(document.getElementById('projects').classList.contains('shelf-3d-active')).toBe(false)
  })
})

describe('deep link', () => {
  const never = class { observe() {} disconnect() {} }
  const okLoad = () => Promise.resolve({ mountShelf3D: vi.fn((el) => { el.appendChild(document.createElement('canvas')); return { unmount: vi.fn() } }) })

  it('3D: a known slug scrolls #projects into view and starts the island without an intersection', async () => {
    const section = document.getElementById('projects')
    section.scrollIntoView = vi.fn()
    const load = vi.fn(okLoad)
    initShelf({ win: capableWin(never, '#work/matchday'), load })
    expect(section.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }))
    expect(load).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(section.classList.contains('shelf-3d-active')).toBe(true))
  })
  it('3D: an unknown slug or no hash changes nothing', () => {
    const section = document.getElementById('projects')
    section.scrollIntoView = vi.fn()
    const load = vi.fn(okLoad)
    initShelf({ win: capableWin(never, '#work/nope'), load })
    initShelf({ win: capableWin(never, '#projects'), load })
    expect(section.scrollIntoView).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
  })
  it('2D: scrolls to the card, focuses it and flips it', () => {
    const card = document.getElementById('matchday-card')
    card.scrollIntoView = vi.fn()
    const win = { document, navigator: { hardwareConcurrency: 8, deviceMemory: 8 }, matchMedia: () => ({ matches: true }), location: { hash: '#work/matchday' } }
    expect(initShelf({ win, load: vi.fn() })).toEqual({ mode: '2d' })
    expect(card.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'instant' }))
    expect(document.activeElement).toBe(card)
    expect(card.dataset.flipped).toBe('true')
  })
  it('2D: unknown slug does nothing', () => {
    const win = { document, navigator: { hardwareConcurrency: 8, deviceMemory: 8 }, matchMedia: () => ({ matches: true }), location: { hash: '#work/nope' } }
    initShelf({ win, load: vi.fn() })
    expect(document.querySelector('.shelf-card[data-flipped="true"]')).toBeNull()
  })
  it('3D: hides aria-pressed on the 2D cards while active and restores it on fallback', async () => {
    const unmount = vi.fn()
    const load = () => Promise.resolve({ mountShelf3D: (el) => { el.appendChild(document.createElement('canvas')); return { unmount } } })
    initShelf({ win: capableWin(firesImmediately), load })
    const projects = document.getElementById('projects')
    await vi.waitFor(() => expect(projects.classList.contains('shelf-3d-active')).toBe(true))
    expect(document.querySelector('.shelf-card[aria-pressed]')).toBeNull()
    document.querySelector('#shelf-3d canvas').dispatchEvent(new Event('webglcontextlost'))
    expect(document.querySelector('.shelf-card[aria-pressed="false"]')).not.toBeNull()
  })
})

describe('mount contract', () => {
  it('ShelfApp exposes mountShelf3D', async () => {
    const mod = await import('../../src/shelf/ShelfApp.jsx')
    expect(typeof mod.mountShelf3D).toBe('function')
  }, 20000)
  it('main.js calls initShelf instead of initProjects', () => {
    const main = readFileSync(join(root, 'src', 'main.js'), 'utf8')
    expect(main).toContain('initShelf()')
    expect(main).not.toContain('initProjects()')
  })
})
