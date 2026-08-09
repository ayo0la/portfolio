import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initProjects } from '../src/sections/projects.js'

const EXPANDABLE_CARDS = ['npm-card', 'allstar-card', 'oss-card', 'client-card']

function expandableMarkup(id) {
  return `
    <div class="project-card ${id}" id="${id}" data-expanded="false">
      <span class="npm-card-hint">▼ view</span>
      <div class="npm-packages"></div>
      <span class="npm-collapse-hint">▲ collapse</span>
    </div>
  `
}

beforeEach(() => {
  document.body.innerHTML = `
    <div class="projects-grid">
      <a class="project-card" id="other-card">Other</a>
      ${EXPANDABLE_CARDS.map(expandableMarkup).join('')}
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

  it('dims sibling project cards on expand', () => {
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

describe('initProjects — missing cards', () => {
  it('does not throw when an expandable card is absent from the DOM', () => {
    document.body.innerHTML = '<div class="projects-grid"></div>'
    expect(() => initProjects()).not.toThrow()
  })
})
