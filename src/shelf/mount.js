// Decides 2D vs 3D for the Other Work shelf and wires the fallbacks.
import { shouldUse3D, detectCapabilities } from './capabilities.js'
import { paintCovers2D } from './covers2d.js'
import { slugFromHash } from './state.js'
import { projectBySlug } from './projects.js'
import { initProjects } from '../sections/projects.js'

const ACTIVE = 'shelf-3d-active'

const jump = (el) => {
  try { el.scrollIntoView({ behavior: 'instant', block: 'start' }) } catch { /* no layout */ }
}

// #work/<slug> on load: 2D scrolls to that card, focuses and flips it.
function openCard2D(doc, slug) {
  const card = doc.querySelector(`.shelf-card[data-slug="${slug}"]`)
  if (!card) return
  jump(card)
  card.focus({ preventScroll: true })
  card.click()
}

export function initShelf({ win = window, load = () => import('./ShelfApp.jsx') } = {}) {
  const doc = win.document
  const deepSlug = slugFromHash(win.location?.hash)

  const run2D = () => {
    initProjects()
    paintCovers2D(doc)
  }

  const section = doc.getElementById('projects')
  const mountEl = doc.getElementById('shelf-3d')
  if (!shouldUse3D(detectCapabilities(win)) || !section || !mountEl) {
    run2D()
    if (deepSlug) openCard2D(doc, deepSlug)
    return { mode: '2d' }
  }

  let instance = null
  let fellBack = false
  let started = false

  const fallBack = () => {
    if (fellBack) return
    fellBack = true
    try { instance?.unmount() } catch { /* island already gone */ }
    instance = null
    section.classList.remove(ACTIVE)
    run2D()
    if (deepSlug && projectBySlug(deepSlug)) openCard2D(doc, deepSlug)
  }

  // webglcontextlost does not bubble; capture it from the mount element
  mountEl.addEventListener('webglcontextlost', fallBack, true)

  const start = () => {
    if (started) return
    started = true
    load()
      .then((mod) => {
        if (fellBack) return
        instance = mod.mountShelf3D(mountEl, { onContextLost: fallBack })
        section.classList.add(ACTIVE)
        // the 2D cards are hidden now; do not announce them as toggle buttons
        doc.querySelectorAll('.shelf-card[aria-pressed]').forEach((c) => c.removeAttribute('aria-pressed'))
      })
      .catch(fallBack)
  }

  // a deep link opens the panel on load: bring the shelf into view and start the island now
  if (deepSlug) {
    jump(section)
    start()
    return { mode: '3d' }
  }

  const IO = win.IntersectionObserver
  if (!IO) {
    start()
  } else {
    let observer = null
    observer = new IO((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect()
        start()
      }
    }, { rootMargin: '100% 0px' })
    observer.observe(section)
  }

  return { mode: '3d' }
}
