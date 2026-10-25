// Connects the HTML layer (hidden shelf cards, index row, keyboard, URL hash) to the 3D island.
import { PROJECTS } from './projects.js'
import { keyToAction, hashFor } from './state.js'

const slugForCardId = (id) => PROJECTS.find((p) => p.cardId === id)?.slug ?? null
const closest = (t, sel) => (t && typeof t.closest === 'function' ? t.closest(sel) : null)

const NO_VIEW = { onScreen: true }

export function keyDecision(e, state, view = NO_VIEW) {
  const t = e.target
  // browser and OS shortcuts (Cmd+Arrow for Back, etc.) are never ours
  if (e.metaKey || e.ctrlKey || e.altKey) return null
  // Escape may always close an open record
  if (e.key === 'Escape' && state.open !== null) return { type: 'close' }
  if (!view.onScreen) return null
  const doc = t?.ownerDocument ?? (typeof document === 'undefined' ? null : document)
  const home = !t || t === doc?.body || t === doc?.documentElement || t === doc
  if (!home && !closest(t, '#projects')) return null
  if (closest(t, 'input, textarea, select, [contenteditable="true"]')) return null
  if (e.key === 'Enter' && state.open === null) {
    // Enter only means "open" from inside a card; index buttons act through click
    if (!closest(t, '.shelf-card')) return null
  }
  if (e.key === ' ' && closest(t, 'button, a, summary')) return null
  return keyToAction(e.key, state)
}

export function attachBridge({ doc = document, IO = doc.defaultView?.IntersectionObserver, getState, dispatch, setIndexHover, setKbFocus }) {
  const onFocusIn = (e) => {
    const card = closest(e.target, '.shelf-card')
    const slug = card?.dataset.slug
    if (slug) {
      dispatch({ type: 'focus', slug })
      setKbFocus(slug)
    } else {
      setKbFocus(null)
    }
  }
  // the shelf counts as on screen once about a third of it (or of the viewport) is visible
  const view = { onScreen: true }
  let io = null
  const section = doc.getElementById('projects')
  if (typeof IO === 'function' && section) {
    view.onScreen = false
    io = new IO((entries) => {
      const e = entries[entries.length - 1]
      if (!e) return
      const vh = e.rootBounds?.height || doc.defaultView?.innerHeight || 0
      view.onScreen = e.intersectionRatio > 0.3 || (vh > 0 && (e.intersectionRect?.height ?? 0) > 0.3 * vh)
    }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1] })
    io.observe(section)
  }
  const onKeyDown = (e) => {
    const action = keyDecision(e, getState(), view)
    if (!action) return
    e.preventDefault()
    dispatch(action)
  }
  const onFocusOut = (e) => {
    if (!closest(e.relatedTarget, '.shelf-card')) setKbFocus(null)
  }
  const onPointerDown = () => setKbFocus(null)
  doc.addEventListener('focusout', onFocusOut)
  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('focusin', onFocusIn)
  doc.addEventListener('keydown', onKeyDown)

  const offs = []
  doc.querySelectorAll('.shelf-index-entry[data-target]').forEach((btn) => {
    const slug = slugForCardId(btn.dataset.target)
    if (!slug) return
    const click = () => dispatch({ type: 'open', slug })
    const enter = () => setIndexHover(slug)
    const leave = () => setIndexHover(null)
    btn.addEventListener('click', click)
    btn.addEventListener('mouseenter', enter)
    btn.addEventListener('mouseleave', leave)
    btn.addEventListener('focus', enter)
    btn.addEventListener('blur', leave)
    offs.push(() => {
      btn.removeEventListener('click', click)
      btn.removeEventListener('mouseenter', enter)
      btn.removeEventListener('mouseleave', leave)
      btn.removeEventListener('focus', enter)
      btn.removeEventListener('blur', leave)
    })
  })

  return () => {
    doc.removeEventListener('focusin', onFocusIn)
    doc.removeEventListener('focusout', onFocusOut)
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('keydown', onKeyDown)
    io?.disconnect()
    offs.forEach((f) => f())
  }
}

// Open writes #work/<slug>; closing drops the hash. Other hashes are left alone.
export function applyHash(win, prevOpen, open) {
  if (open) {
    if (win.location.hash !== hashFor(open)) win.history.replaceState(null, '', hashFor(open))
  } else if (prevOpen) {
    win.history.replaceState(null, '', win.location.pathname + win.location.search)
  }
}

export function setActiveEntry(doc, slug) {
  const target = slug ? PROJECTS.find((p) => p.slug === slug)?.cardId : null
  doc.querySelectorAll('.shelf-index-entry').forEach((btn) => {
    btn.classList.toggle('is-active', !!target && btn.dataset.target === target)
  })
}
