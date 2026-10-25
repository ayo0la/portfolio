import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { PROJECTS, projectBySlug } from '../../src/shelf/projects.js'
import { OpenPanel } from '../../src/shelf/overlay/OpenPanel.jsx'
import { BackFace } from '../../src/shelf/overlay/BackFace.jsx'
import { ChessOverlay } from '../../src/shelf/overlay/ChessOverlay.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let host
let root
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.restoreAllMocks()
})
const render = (el) => act(() => root.render(el))

describe('OpenPanel', () => {
  const sq = projectBySlug('square-a')
  const noop = () => {}
  const props = { project: sq, flipped: false, onFlip: noop, onClose: noop, onNext: noop, onPrev: noop }

  it('shows the tag, name and pitch', () => {
    render(h(OpenPanel, props))
    const panel = host.querySelector('[data-testid="open-panel"]')
    expect(panel).not.toBeNull()
    expect(panel.textContent).toContain(sq.tag)
    expect(panel.textContent).toContain(sq.name)
    expect(panel.textContent).toContain(sq.pitch)
  })

  it('links Open site to the project in a new tab', () => {
    render(h(OpenPanel, props))
    const a = host.querySelector('a[href="https://app.squarea.agency"]')
    expect(a).not.toBeNull()
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toContain('noopener')
    expect(a.textContent).toMatch(/open site/i)
  })

  it('has no Open site link for a project without a link', () => {
    render(h(OpenPanel, { ...props, project: projectBySlug('client-sites') }))
    expect(host.querySelector('a[target="_blank"]')).toBeNull()
  })

  it('wires flip, close, next and prev', () => {
    const fns = { onFlip: vi.fn(), onClose: vi.fn(), onNext: vi.fn(), onPrev: vi.fn() }
    render(h(OpenPanel, { ...props, ...fns }))
    const click = (name) => act(() => host.querySelector(`button[aria-label="${name}"]`).click())
    click('Flip the record')
    click('Close')
    click('Next project')
    click('Previous project')
    expect(fns.onFlip).toHaveBeenCalledTimes(1)
    expect(fns.onClose).toHaveBeenCalledTimes(1)
    expect(fns.onNext).toHaveBeenCalledTimes(1)
    expect(fns.onPrev).toHaveBeenCalledTimes(1)
  })

  it('labels the flip button by side', () => {
    render(h(OpenPanel, { ...props, flipped: true }))
    expect(host.querySelector('button[aria-label="Flip the record"]').getAttribute('aria-pressed')).toBe('true')
  })

  it('carries is-day when the day mix passes one half, so text stays light on the scrim', () => {
    render(h(OpenPanel, { ...props, dayMix: 0.2 }))
    expect(host.querySelector('[data-testid="open-panel"]').classList.contains('is-day')).toBe(false)
    render(h(OpenPanel, { ...props, dayMix: 0.8 }))
    expect(host.querySelector('[data-testid="open-panel"]').classList.contains('is-day')).toBe(true)
  })

  it('moves focus to Close on mount', () => {
    render(h(OpenPanel, props))
    expect(document.activeElement).toBe(host.querySelector('button[aria-label="Close"]'))
  })

  it('restores focus to the record open at close time, not the one that was first', () => {
    const wrap = document.createElement('div')
    wrap.innerHTML = PROJECTS.map((p) => `<div class="shelf-card" data-slug="${p.slug}" id="${p.cardId}" tabindex="0"></div>`).join('')
    document.body.appendChild(wrap)
    const first = wrap.querySelector(`[data-slug="${sq.slug}"]`)
    first.focus()
    render(h(OpenPanel, props))
    const other = projectBySlug('matchday')
    render(h(OpenPanel, { ...props, project: other }))
    render(null)
    expect(document.activeElement).toBe(wrap.querySelector(`[data-slug="${other.slug}"]`))
    wrap.remove()
  })

  it('restores focus to the opener when the same record is still open', () => {
    const btn = document.createElement('button')
    document.body.appendChild(btn)
    btn.focus()
    render(h(OpenPanel, props))
    render(null)
    expect(document.activeElement).toBe(btn)
    btn.remove()
  })
})

describe('BackFace', () => {
  it('renders every track of every project', () => {
    for (const p of PROJECTS) {
      render(h(BackFace, { project: p }))
      const text = host.textContent
      for (const t of p.tracks) expect(text).toContain(t.name)
    }
  })

  it('makes tracks with an href real links', () => {
    const p = projectBySlug('allstar-kids')
    render(h(BackFace, { project: p }))
    const a = host.querySelector('a[href="https://allstarkids-platform.vercel.app"]')
    expect(a).not.toBeNull()
    expect(a.getAttribute('target')).toBe('_blank')
  })

  it('shows the footer link', () => {
    render(h(BackFace, { project: projectBySlug('matchday') }))
    expect(host.querySelector('a[href="https://matchday-sooty.vercel.app"]')).not.toBeNull()
  })

  it('upstream shows the +additions and -deletions totals from data', () => {
    render(h(BackFace, { project: projectBySlug('upstream'), upstream: { merged: 5, additions: 502, deletions: 212, stars: 62000 } }))
    expect(host.textContent).toContain('+502')
    expect(host.textContent).toContain('−212')
  })

  it('npm rows show the package names and no number when downloads are null', () => {
    render(h(BackFace, { project: projectBySlug('npm'), downloads: null }))
    expect(host.textContent).toContain('@ayo0la/grain-canvas')
    expect(host.textContent).toContain('@ayo0la/cursor')
    expect(host.querySelectorAll('[data-downloads]')).toHaveLength(0)
  })

  it('npm rows show weekly downloads once they arrive', () => {
    render(h(BackFace, { project: projectBySlug('npm'), downloads: { '@ayo0la/cursor': 1234 } }))
    const rows = host.querySelectorAll('[data-downloads]')
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toContain('1,234')
  })
})

describe('ChessOverlay', () => {
  it('mounts a 64 square board into a chess-play block and tears it down', () => {
    render(h(ChessOverlay))
    const play = host.querySelector('.chess-play')
    expect(play).not.toBeNull()
    expect(play.querySelectorAll('.sq')).toHaveLength(64)
    act(() => root.render(null))
    expect(host.querySelector('.chess-play')).toBeNull()
  })
})

describe('deep link', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = '<section id="projects"><div id="shelf-3d"></div></section>'
    window.history.replaceState(null, '', '/#work/matchday')
  })
  afterEach(() => {
    vi.doUnmock('@react-three/fiber')
    vi.doUnmock('../../src/shelf/three/ShelfScene.jsx')
    window.history.replaceState(null, '', '/')
  })

  it('opens the panel from #work/matchday on mount and Escape closes it and clears the hash', async () => {
    vi.doMock('@react-three/fiber', () => ({ Canvas: () => null }))
    vi.doMock('../../src/shelf/three/ShelfScene.jsx', () => ({ ShelfScene: () => null }))
    const { mountShelf3D } = await import('../../src/shelf/ShelfApp.jsx')
    const el = document.getElementById('shelf-3d')
    let inst
    await act(async () => { inst = mountShelf3D(el) })
    const panel = el.querySelector('[data-testid="open-panel"]')
    expect(panel).not.toBeNull()
    expect(panel.textContent).toContain('Matchday')
    expect(window.location.hash).toBe('#work/matchday')

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(window.location.hash).toBe('')
    // the panel leaves once its exit animation ends
    for (let i = 0; i < 100 && el.querySelector('[data-testid="open-panel"]'); i++) {
      await act(async () => { await new Promise((r) => setTimeout(r, 25)) })
    }
    expect(el.querySelector('[data-testid="open-panel"]')).toBeNull()
    await act(async () => { inst.unmount() })
  })
})

describe('PanIndicator', () => {
  it('shows position, marks the active dot, and dot taps pan', async () => {
    const { PanIndicator } = await import('../../src/shelf/overlay/PanIndicator.jsx')
    const picks = []
    render(h(PanIndicator, { projects: PROJECTS, index: 2, onPick: (i) => picks.push(i) }))
    const dots = host.querySelectorAll('.shelf-pan-dot')
    expect(dots).toHaveLength(PROJECTS.length)
    expect(dots[2].getAttribute('aria-current')).toBe('true')
    expect(dots[0].getAttribute('aria-current')).toBeNull()
    expect(dots[0].getAttribute('aria-label')).toBe(`Show ${PROJECTS[0].name}`)
    expect(host.querySelector('.shelf-pan-label').textContent).toContain(`3 / ${PROJECTS.length} · Swipe`)
    act(() => dots[5].dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(picks).toEqual([5])
  })
})
