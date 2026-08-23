import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initProjects } from '../src/sections/projects.js'

const EXPANDABLE_CARDS = ['npm-card', 'allstar-card', 'oss-card', 'client-card']

function expandableMarkup(id) {
  return `
    <div class="shelf-card ${id}" id="${id}" data-expanded="false">
      <div class="cover"></div>
      <div class="npm-packages"></div>
    </div>
  `
}

beforeEach(() => {
  document.body.innerHTML = `
    <div class="shelf-wall">
      <div class="shelf-row">
        <a class="shelf-card" id="other-card">Other</a>
        ${EXPANDABLE_CARDS.map(expandableMarkup).join('')}
      </div>
    </div>
    <div class="shelf-index">
      <button data-target="other-card"></button>
      ${EXPANDABLE_CARDS.map(id => `<button data-target="${id}"></button>`).join('')}
    </div>
  `
  initProjects()
})

afterEach(() => {
  vi.clearAllTimers()
  document.body.innerHTML = ''
})

describe.each(EXPANDABLE_CARDS)('initProjects — %s expand', (id) => {
  it('sets data-expanded to true on click', () => {
    document.getElementById(id).click()
    expect(document.getElementById(id).dataset.expanded).toBe('true')
  })

  it('mirrors state onto aria-expanded', () => {
    document.getElementById(id).click()
    expect(document.getElementById(id).getAttribute('aria-expanded')).toBe('true')
  })

  it('dims sibling shelf cards on expand', () => {
    document.getElementById(id).click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(true)
  })

  it('does not dim itself', () => {
    document.getElementById(id).click()
    expect(document.getElementById(id).classList.contains('dimmed')).toBe(false)
  })

  it('expands on Enter key', () => {
    document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(document.getElementById(id).dataset.expanded).toBe('true')
  })

  it('expands on Space key', () => {
    document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(document.getElementById(id).dataset.expanded).toBe('true')
  })
})

describe.each(EXPANDABLE_CARDS)('initProjects — %s collapse', (id) => {
  it('sets data-expanded to false on second click', () => {
    const card = document.getElementById(id)
    card.click()
    card.click()
    expect(card.dataset.expanded).toBe('false')
  })

  it('removes dimmed from siblings on collapse', () => {
    const card = document.getElementById(id)
    card.click()
    card.click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(false)
  })

  it('collapses when clicking outside the card', () => {
    vi.useFakeTimers()
    document.getElementById(id).click()
    vi.runAllTimers()
    document.body.click()
    expect(document.getElementById(id).dataset.expanded).toBe('false')
    vi.useRealTimers()
  })
})

describe('initProjects — shelf index', () => {
  it('focuses the targeted card when an index entry is clicked', () => {
    const card = document.getElementById('npm-card')
    card.tabIndex = 0
    document.querySelector('[data-target="npm-card"]').click()
    expect(document.activeElement).toBe(card)
  })

  it('does not throw when an index entry targets a missing card', () => {
    document.querySelector('[data-target="npm-card"]').dataset.target = 'nope'
    expect(() => document.querySelector('[data-target="nope"]').click()).not.toThrow()
  })
})

describe('initProjects — missing cards', () => {
  it('does not throw when an expandable card is absent from the DOM', () => {
    document.body.innerHTML = '<div class="shelf-wall"></div>'
    expect(() => initProjects()).not.toThrow()
  })
})
