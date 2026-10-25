import { PROJECTS, projectBySlug } from './projects.js'

export const initialState = { open: null, flipped: false, focus: null }

function step(state, delta) {
  const i = PROJECTS.findIndex((p) => p.slug === state.open)
  if (i < 0) return state
  const slug = PROJECTS[(i + delta + PROJECTS.length) % PROJECTS.length].slug
  return { ...state, open: slug, flipped: false, focus: slug }
}

export function shelfReducer(state, action) {
  switch (action.type) {
    case 'open':
      if (!projectBySlug(action.slug)) return state
      return { open: action.slug, flipped: false, focus: action.slug }
    case 'close':
      if (state.open === null) return state
      return { open: null, flipped: false, focus: state.open }
    case 'flip':
      return state.open === null ? state : { ...state, flipped: !state.flipped }
    case 'next':
      return step(state, 1)
    case 'prev':
      return step(state, -1)
    case 'focus':
      return { ...state, focus: action.slug }
    default:
      return state
  }
}

export function keyToAction(key, state) {
  if (state.open !== null) {
    if (key === 'Escape') return { type: 'close' }
    if (key === ' ') return { type: 'flip' }
    if (key === 'ArrowRight') return { type: 'next' }
    if (key === 'ArrowLeft') return { type: 'prev' }
    return null
  }
  if (key === 'Enter' && state.focus) return { type: 'open', slug: state.focus }
  return null
}

export const hashFor = (slug) => `#work/${slug}`

export function slugFromHash(hash) {
  const m = /^#work\/([^/]+)$/.exec(hash ?? '')
  return m && projectBySlug(m[1]) ? m[1] : null
}
