import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initProjects } from '../src/sections/projects.js'

beforeEach(() => {
  document.body.innerHTML = `
    <div class="projects-grid">
      <a class="project-card" id="other-card">Other</a>
      <div class="project-card npm-card" id="npm-card" data-expanded="false">
        <span class="npm-card-hint">▼ view packages</span>
        <div class="npm-packages"></div>
        <span class="npm-collapse-hint">▲ collapse</span>
      </div>
      <div class="project-card allstar-card" id="allstar-card" data-expanded="false">
        <span class="npm-card-hint">▼ view projects</span>
        <div class="allstar-projects"></div>
        <span class="npm-collapse-hint">▲ collapse</span>
      </div>
    </div>
  `
  initProjects()
})

afterEach(() => {
  vi.clearAllTimers()
  document.body.innerHTML = ''
})

describe('initProjects — npm-card expand', () => {
  it('sets data-expanded to true on click', () => {
    document.getElementById('npm-card').click()
    expect(document.getElementById('npm-card').dataset.expanded).toBe('true')
  })

  it('dims sibling project cards on expand', () => {
    document.getElementById('npm-card').click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(true)
  })

  it('expands on Enter key', () => {
    document.getElementById('npm-card').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(document.getElementById('npm-card').dataset.expanded).toBe('true')
  })

  it('expands on Space key', () => {
    document.getElementById('npm-card').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(document.getElementById('npm-card').dataset.expanded).toBe('true')
  })
})

describe('initProjects — npm-card collapse', () => {
  it('sets data-expanded to false on second click', () => {
    const card = document.getElementById('npm-card')
    card.click()
    card.click()
    expect(card.dataset.expanded).toBe('false')
  })

  it('removes dimmed from siblings on collapse', () => {
    const card = document.getElementById('npm-card')
    card.click()
    card.click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(false)
  })

  it('collapses when clicking outside the card', () => {
    vi.useFakeTimers()
    document.getElementById('npm-card').click()
    vi.runAllTimers()
    document.body.click()
    expect(document.getElementById('npm-card').dataset.expanded).toBe('false')
    vi.useRealTimers()
  })
})

describe('initProjects — allstar-card expand', () => {
  it('sets data-expanded to true on click', () => {
    document.getElementById('allstar-card').click()
    expect(document.getElementById('allstar-card').dataset.expanded).toBe('true')
  })

  it('dims sibling project cards on expand', () => {
    document.getElementById('allstar-card').click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(true)
  })

  it('expands on Enter key', () => {
    document.getElementById('allstar-card').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(document.getElementById('allstar-card').dataset.expanded).toBe('true')
  })

  it('expands on Space key', () => {
    document.getElementById('allstar-card').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(document.getElementById('allstar-card').dataset.expanded).toBe('true')
  })
})

describe('initProjects — allstar-card collapse', () => {
  it('sets data-expanded to false on second click', () => {
    const card = document.getElementById('allstar-card')
    card.click()
    card.click()
    expect(card.dataset.expanded).toBe('false')
  })

  it('removes dimmed from siblings on collapse', () => {
    const card = document.getElementById('allstar-card')
    card.click()
    card.click()
    expect(document.getElementById('other-card').classList.contains('dimmed')).toBe(false)
  })

  it('collapses when clicking outside the card', () => {
    vi.useFakeTimers()
    document.getElementById('allstar-card').click()
    vi.runAllTimers()
    document.body.click()
    expect(document.getElementById('allstar-card').dataset.expanded).toBe('false')
    vi.useRealTimers()
  })
})
