import { describe, it, expect } from 'vitest'
import { initialState, shelfReducer, keyToAction, hashFor, slugFromHash } from '../../src/shelf/state.js'
import { PROJECTS } from '../../src/shelf/projects.js'

const opened = (slug) => shelfReducer(initialState, { type: 'open', slug })

describe('shelfReducer', () => {
  it('starts closed', () => {
    expect(initialState).toEqual({ open: null, flipped: false, focus: null })
  })
  it('open sets open and resets flipped', () => {
    const flipped = shelfReducer(opened('npm'), { type: 'flip' })
    expect(flipped.flipped).toBe(true)
    const s = shelfReducer(flipped, { type: 'open', slug: 'matchday' })
    expect(s.open).toBe('matchday')
    expect(s.flipped).toBe(false)
  })
  it('open with an unknown slug leaves state unchanged', () => {
    expect(shelfReducer(initialState, { type: 'open', slug: 'nope' })).toBe(initialState)
  })
  it('flip toggles only when open', () => {
    expect(shelfReducer(initialState, { type: 'flip' })).toEqual(initialState)
    const a = shelfReducer(opened('npm'), { type: 'flip' })
    expect(a.flipped).toBe(true)
    expect(shelfReducer(a, { type: 'flip' }).flipped).toBe(false)
  })
  it('close clears open and flipped and keeps focus on the slug that was open', () => {
    const s = shelfReducer(shelfReducer(opened('npm'), { type: 'flip' }), { type: 'close' })
    expect(s).toEqual({ open: null, flipped: false, focus: 'npm' })
  })
  it('next and prev walk PROJECTS order, wrap, and reset flipped', () => {
    const first = PROJECTS[0].slug
    const last = PROJECTS[PROJECTS.length - 1].slug
    expect(last).toBe('client-sites')
    const flippedLast = shelfReducer(opened(last), { type: 'flip' })
    const n = shelfReducer(flippedLast, { type: 'next' })
    expect(n.open).toBe(first)
    expect(n.flipped).toBe(false)
    expect(shelfReducer(opened(first), { type: 'prev' }).open).toBe(last)
    expect(shelfReducer(opened('upstream'), { type: 'next' }).open).toBe('allstar-kids')
    expect(shelfReducer(opened('upstream'), { type: 'prev' }).open).toBe('square-a')
  })
  it('next and prev do nothing when closed', () => {
    expect(shelfReducer(initialState, { type: 'next' })).toEqual(initialState)
    expect(shelfReducer(initialState, { type: 'prev' })).toEqual(initialState)
  })
  it('focus sets focus', () => {
    expect(shelfReducer(initialState, { type: 'focus', slug: 'npm' }).focus).toBe('npm')
  })
})

describe('keyToAction', () => {
  const open = opened('npm')
  const focused = { ...initialState, focus: 'matchday' }
  it('maps keys when open', () => {
    expect(keyToAction('Escape', open)).toEqual({ type: 'close' })
    expect(keyToAction(' ', open)).toEqual({ type: 'flip' })
    expect(keyToAction('ArrowRight', open)).toEqual({ type: 'next' })
    expect(keyToAction('ArrowLeft', open)).toEqual({ type: 'prev' })
  })
  it('ignores those keys when closed', () => {
    expect(keyToAction('Escape', initialState)).toBeNull()
    expect(keyToAction(' ', initialState)).toBeNull()
    expect(keyToAction('ArrowRight', focused)).toBeNull()
    expect(keyToAction('ArrowLeft', focused)).toBeNull()
  })
  it('Enter opens the focused project when nothing is open', () => {
    expect(keyToAction('Enter', focused)).toEqual({ type: 'open', slug: 'matchday' })
    expect(keyToAction('Enter', initialState)).toBeNull()
    expect(keyToAction('Enter', open)).toBeNull()
  })
  it('returns null for other keys', () => {
    expect(keyToAction('a', open)).toBeNull()
  })
})

describe('hash helpers', () => {
  it('round trips', () => {
    expect(hashFor('chess-rivals')).toBe('#work/chess-rivals')
    expect(slugFromHash('#work/chess-rivals')).toBe('chess-rivals')
  })
  it('returns null for unknown and non-work hashes', () => {
    expect(slugFromHash('#work/does-not-exist')).toBeNull()
    expect(slugFromHash('#projects')).toBeNull()
    expect(slugFromHash('')).toBeNull()
    expect(slugFromHash(undefined)).toBeNull()
  })
})
