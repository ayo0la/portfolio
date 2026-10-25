import { describe, it, expect, vi, beforeEach } from 'vitest'
import { attachBridge, keyDecision, applyHash, setActiveEntry } from '../../src/shelf/bridge.js'
import { initialState } from '../../src/shelf/state.js'

function dom() {
  document.body.innerHTML = `
    <section id="projects">
    <div class="shelf-card" data-slug="matchday" id="matchday-card" tabindex="0"><a href="#x" id="lnk">l</a></div>
    <div class="shelf-card" data-slug="npm" id="npm-card" tabindex="0"></div>
    <button class="shelf-index-entry" data-target="matchday-card" id="e1">m</button>
    <button class="shelf-index-entry" data-target="npm-card" id="e2">n</button>
    </section>
    <input id="field">`
}

describe('keyDecision', () => {
  const focused = { ...initialState, focus: 'matchday' }
  const open = { open: 'matchday', flipped: false, focus: 'matchday' }
  it('opens on Enter only from inside a card', () => {
    dom()
    expect(keyDecision({ key: 'Enter', target: document.getElementById('matchday-card') }, focused)).toEqual({ type: 'open', slug: 'matchday' })
    expect(keyDecision({ key: 'Enter', target: document.getElementById('field') }, focused)).toBeNull()
    expect(keyDecision({ key: 'Enter', target: document.getElementById('e1') }, focused)).toBeNull()
  })
  it('handles Escape and arrows while open, but not inside inputs', () => {
    dom()
    expect(keyDecision({ key: 'Escape', target: document.body }, open)).toEqual({ type: 'close' })
    expect(keyDecision({ key: 'ArrowRight', target: document.body }, open)).toEqual({ type: 'next' })
    expect(keyDecision({ key: 'ArrowRight', target: document.getElementById('field') }, open)).toBeNull()
  })
  it('leaves Space on a focused button or link to that control', () => {
    dom()
    expect(keyDecision({ key: ' ', target: document.getElementById('lnk') }, open)).toBeNull()
    expect(keyDecision({ key: ' ', target: document.body }, open)).toEqual({ type: 'flip' })
  })
})

describe('keyDecision guards', () => {
  const open = { open: 'matchday', flipped: false, focus: 'matchday' }
  const onScreen = { onScreen: true }
  const off = { onScreen: false }
  const inSection = () => { dom(); document.getElementById('projects').insertAdjacentHTML('beforeend', '<button id="inner">x</button>'); document.body.insertAdjacentHTML('beforeend', '<div id="blog"><a id="blogLink" href="#">b</a></div>'); return document.getElementById('inner') }
  it('ignores any key with a modifier', () => {
    inSection()
    for (const m of ['metaKey', 'ctrlKey', 'altKey']) {
      expect(keyDecision({ key: 'ArrowLeft', [m]: true, target: document.body }, open, onScreen)).toBeNull()
    }
  })
  it('ignores keys while the shelf is off screen', () => {
    inSection()
    expect(keyDecision({ key: ' ', target: document.body }, open, off)).toBeNull()
    expect(keyDecision({ key: 'ArrowRight', target: document.body }, open, off)).toBeNull()
  })
  it('ignores keys when focus is elsewhere on the page', () => {
    inSection()
    expect(keyDecision({ key: 'ArrowRight', target: document.getElementById('blogLink') }, open, onScreen)).toBeNull()
    expect(keyDecision({ key: 'ArrowRight', target: document.getElementById('field') }, open, onScreen)).toBeNull()
  })
  it('handles keys from inside the section and from the body', () => {
    const inner = inSection()
    expect(keyDecision({ key: 'ArrowRight', target: inner }, open, onScreen)).toEqual({ type: 'next' })
    expect(keyDecision({ key: 'ArrowLeft', target: document.body }, open, onScreen)).toEqual({ type: 'prev' })
    expect(keyDecision({ key: 'ArrowLeft', target: null }, open, onScreen)).toEqual({ type: 'prev' })
  })
  it('Escape closes an open record even off screen or from elsewhere', () => {
    inSection()
    expect(keyDecision({ key: 'Escape', target: document.getElementById('blogLink') }, open, off)).toEqual({ type: 'close' })
  })
})

describe('attachBridge key handling', () => {
  const fakeIO = () => {
    const inst = {}
    class IO { constructor(cb) { inst.cb = cb } observe() {} disconnect() {} }
    return { IO, inst }
  }
  it('does not preventDefault for ignored keys and tracks on-screen ratio', () => {
    dom()
    const { IO, inst } = fakeIO()
    const dispatch = vi.fn()
    const off = attachBridge({ doc: document, IO, getState: () => ({ open: 'npm', flipped: false, focus: 'npm' }), dispatch, setIndexHover: vi.fn(), setKbFocus: vi.fn() })
    const press = (init) => { const e = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true, ...init }); document.body.dispatchEvent(e); return e }
    inst.cb([{ intersectionRatio: 0.1, intersectionRect: { height: 10 }, rootBounds: { height: 1000 } }])
    expect(press({}).defaultPrevented).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
    inst.cb([{ intersectionRatio: 0.5, intersectionRect: { height: 500 }, rootBounds: { height: 1000 } }])
    expect(press({}).defaultPrevented).toBe(true)
    expect(dispatch).toHaveBeenCalledWith({ type: 'flip' })
    dispatch.mockClear()
    const meta = press({ metaKey: true, key: 'ArrowLeft' })
    expect(meta.defaultPrevented).toBe(false)
    expect(dispatch).not.toHaveBeenCalled()
    off()
  })
})

describe('attachBridge', () => {
  let dispatch, setIndexHover, setKbFocus, state
  beforeEach(() => {
    dom()
    dispatch = vi.fn(); setIndexHover = vi.fn(); setKbFocus = vi.fn()
    state = { ...initialState }
  })
  const go = () => attachBridge({ doc: document, getState: () => state, dispatch, setIndexHover, setKbFocus })

  it('focusin on a card dispatches focus', () => {
    const off = go()
    document.getElementById('npm-card').dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'focus', slug: 'npm' })
    expect(setKbFocus).toHaveBeenCalledWith('npm')
    off()
  })
  it('clicking an index entry opens its record; hovering highlights it', () => {
    const off = go()
    const e = document.getElementById('e2')
    e.dispatchEvent(new MouseEvent('mouseenter'))
    expect(setIndexHover).toHaveBeenLastCalledWith('npm')
    e.dispatchEvent(new MouseEvent('mouseleave'))
    expect(setIndexHover).toHaveBeenLastCalledWith(null)
    e.click()
    expect(dispatch).toHaveBeenCalledWith({ type: 'open', slug: 'npm' })
    off()
  })
  it('keydown at the document dispatches through keyToAction and detaches cleanly', () => {
    state = { open: 'npm', flipped: false, focus: 'npm' }
    const off = go()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(dispatch).toHaveBeenCalledWith({ type: 'close' })
    off()
    dispatch.mockClear()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(dispatch).not.toHaveBeenCalled()
  })
})

describe('applyHash', () => {
  const win = (hash) => ({ location: { hash, pathname: '/', search: '?a=1' }, history: { replaceState: vi.fn() } })
  it('writes the hash on open and clears it on close', () => {
    const w = win('')
    applyHash(w, null, 'matchday')
    expect(w.history.replaceState).toHaveBeenCalledWith(null, '', '#work/matchday')
    applyHash(w, 'matchday', null)
    expect(w.history.replaceState).toHaveBeenLastCalledWith(null, '', '/?a=1')
  })
  it('does not touch an unrelated hash on first mount', () => {
    const w = win('#projects')
    applyHash(w, null, null)
    expect(w.history.replaceState).not.toHaveBeenCalled()
  })
})

describe('setActiveEntry', () => {
  it('marks only the entry of the active slug', () => {
    dom()
    setActiveEntry(document, 'npm')
    expect(document.getElementById('e2').classList.contains('is-active')).toBe(true)
    expect(document.getElementById('e1').classList.contains('is-active')).toBe(false)
    setActiveEntry(document, null)
    expect(document.querySelector('.is-active')).toBeNull()
  })
})

describe('keyboard focus glow', () => {
  it('clears on pointerdown and when focus leaves the cards', () => {
    dom()
    const setKbFocus = vi.fn()
    const off = attachBridge({ doc: document, getState: () => initialState, dispatch: vi.fn(), setIndexHover: vi.fn(), setKbFocus })
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    expect(setKbFocus).toHaveBeenLastCalledWith(null)
    setKbFocus.mockClear()
    document.getElementById('npm-card').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.getElementById('field') }))
    expect(setKbFocus).toHaveBeenLastCalledWith(null)
    setKbFocus.mockClear()
    document.getElementById('npm-card').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.getElementById('matchday-card') }))
    expect(setKbFocus).not.toHaveBeenCalled()
    off()
  })
})
