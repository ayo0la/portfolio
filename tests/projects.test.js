import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { initProjects, mountChessGame } from '../src/sections/projects.js'

const CARD_IDS = ['squarea-card', 'oss-card', 'npm-card', 'client-card']

function cardMarkup(id) {
  return `
    <div class="shelf-card" id="${id}" data-flipped="false" role="button" tabindex="0">
      <div class="cover">
        <div class="flipper">
          <div class="face face-front"></div>
          <div class="face face-back">
            <a class="track" href="https://example.com" id="${id}-link">link</a>
          </div>
        </div>
      </div>
    </div>
  `
}

beforeEach(() => {
  document.body.innerHTML = `
    <div class="shelf-wall">
      <div class="shelf-row">
        ${CARD_IDS.map(cardMarkup).join('')}
      </div>
    </div>
    <div class="shelf-index">
      ${CARD_IDS.map(id => `<button data-target="${id}"></button>`).join('')}
    </div>
  `
  initProjects()
})

afterEach(() => {
  vi.clearAllTimers()
  document.body.innerHTML = ''
})

describe.each(CARD_IDS)('initProjects — %s flip', (id) => {
  it('flips on click', () => {
    document.getElementById(id).click()
    expect(document.getElementById(id).dataset.flipped).toBe('true')
  })

  it('mirrors state onto aria-pressed', () => {
    document.getElementById(id).click()
    expect(document.getElementById(id).getAttribute('aria-pressed')).toBe('true')
  })

  it('flips back on second click', () => {
    const card = document.getElementById(id)
    card.click()
    card.click()
    expect(card.dataset.flipped).toBe('false')
  })

  it('flips on Enter key', () => {
    document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(document.getElementById(id).dataset.flipped).toBe('true')
  })

  it('flips on Space key', () => {
    document.getElementById(id).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(document.getElementById(id).dataset.flipped).toBe('true')
  })

  it('does not flip back when a link on the back face is clicked', () => {
    const card = document.getElementById(id)
    card.click()
    const link = document.getElementById(`${id}-link`)
    link.addEventListener('click', e => e.preventDefault())
    link.click()
    expect(card.dataset.flipped).toBe('true')
  })

  it('unflips when clicking outside the card', () => {
    vi.useFakeTimers()
    document.getElementById(id).click()
    vi.runAllTimers()
    document.body.click()
    expect(document.getElementById(id).dataset.flipped).toBe('false')
    vi.useRealTimers()
  })

  it('only one card stays flipped at a time', () => {
    vi.useFakeTimers()
    document.getElementById(id).click()
    vi.runAllTimers()
    const other = CARD_IDS.find(x => x !== id)
    document.getElementById(other).click()
    vi.runAllTimers()
    expect(document.getElementById(id).dataset.flipped).toBe('false')
    expect(document.getElementById(other).dataset.flipped).toBe('true')
    vi.useRealTimers()
  })
})

describe('initProjects — pointer tilt', () => {
  it('sets tilt angle vars on the flipper on mousemove when hover media matches', () => {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('hover'), addEventListener: vi.fn() }))
    document.body.innerHTML = `
      <div class="shelf-wall"><div class="shelf-row">${cardMarkup('squarea-card')}</div></div>
      <div class="shelf-index"></div>
    `
    initProjects()
    const card = document.getElementById('squarea-card')
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 })
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 0, bubbles: true }))
    const flipper = card.querySelector('.flipper')
    expect(flipper.style.transform).toMatch(/rotateX/)
    delete window.matchMedia
  })

  it('resets tilt vars on mouseleave', () => {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('hover'), addEventListener: vi.fn() }))
    document.body.innerHTML = `
      <div class="shelf-wall"><div class="shelf-row">${cardMarkup('squarea-card')}</div></div>
      <div class="shelf-index"></div>
    `
    initProjects()
    const card = document.getElementById('squarea-card')
    card.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 })
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 0, bubbles: true }))
    card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    const flipper = card.querySelector('.flipper')
    expect(flipper.style.transform).toBe('rotateX(0deg) rotateY(0deg)')
    delete window.matchMedia
  })

  it('does not throw when matchMedia is unavailable (jsdom default)', () => {
    expect(() => {
      document.getElementById('squarea-card').dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
    }).not.toThrow()
  })
})

describe('initProjects — chess', () => {
  function sceneDom() {
    document.body.innerHTML = `
      <div class="shelf-wall"><div class="shelf-row">
        <div class="shelf-card" id="chess-card" data-flipped="false" role="button" tabindex="0">
          <div class="cover"><div class="flipper">
            <div class="face face-front cover-gen cover-chess">
              <div class="cover-motif chess-play">
                <div class="chess-board"></div>
                <span class="chess-status"></span>
                <button class="chess-reset" type="button">↺</button>
              </div>
            </div>
            <div class="face face-back"></div>
          </div></div>
        </div>
      </div></div>
      <div class="shelf-index"></div>
    `
  }

  function mockHover() {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('hover'), addEventListener: vi.fn() }))
  }

  afterEach(() => { delete window.matchMedia })

  it('builds a 64-square chess board with the starting position', () => {
    sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    expect(board.querySelectorAll('.sq')).toHaveLength(64)
    expect(board.querySelector('[data-sq="e2"]').textContent).toBe('♟')
    expect(board.querySelector('[data-sq="e8"]').textContent).toBe('♚')
    expect(board.querySelector('[data-sq="e4"]').textContent).toBe('')
  })

  it('marks the board live for fine pointers', () => {
    mockHover(); sceneDom(); initProjects()
    expect(document.querySelector('#chess-card .chess-play').dataset.live).toBe('true')
  })

  it('shows legal-move hints when a white piece is selected', () => {
    mockHover(); sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    board.querySelector('[data-sq="e2"]').click()
    expect(board.querySelector('[data-sq="e3"]').classList.contains('hint')).toBe(true)
    expect(board.querySelector('[data-sq="e4"]').classList.contains('hint')).toBe(true)
  })

  it('plays the move and black replies', () => {
    vi.useFakeTimers()
    mockHover(); sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    board.querySelector('[data-sq="e2"]').click()
    board.querySelector('[data-sq="e4"]').click()
    expect(board.querySelector('[data-sq="e4"]').textContent).toBe('♟')
    expect(board.querySelector('[data-sq="e2"]').textContent).toBe('')
    vi.advanceTimersByTime(1000)
    const status = document.querySelector('#chess-card .chess-status')
    expect(status.textContent).toMatch(/YOUR MOVE|CHECK/)
    vi.useRealTimers()
  })

  it('does not flip the card when the live board is clicked', () => {
    mockHover(); sceneDom(); initProjects()
    const card = document.getElementById('chess-card')
    card.querySelector('[data-sq="e2"]').click()
    expect(card.dataset.flipped).toBe('false')
  })

  it('coaches when a black piece is clicked', () => {
    mockHover(); sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    board.querySelector('[data-sq="e7"]').click()
    expect(document.querySelector('#chess-card .chess-status').textContent).toMatch(/gold/i)
  })

  it("highlights black's reply squares so the move is visible", () => {
    vi.useFakeTimers()
    mockHover(); sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    board.querySelector('[data-sq="e2"]').click()
    board.querySelector('[data-sq="e4"]').click()
    vi.advanceTimersByTime(1000)
    expect(board.querySelectorAll('.sq.last')).toHaveLength(2)
    vi.useRealTimers()
  })

  it('reset restores the starting position', () => {
    vi.useFakeTimers()
    mockHover(); sceneDom(); initProjects()
    const board = document.querySelector('#chess-card .chess-board')
    board.querySelector('[data-sq="e2"]').click()
    board.querySelector('[data-sq="e4"]').click()
    document.querySelector('#chess-card .chess-reset').click()
    expect(board.querySelector('[data-sq="e2"]').textContent).toBe('♟')
    expect(board.querySelector('[data-sq="e4"]').textContent).toBe('')
    vi.useRealTimers()
  })
})

describe('mountChessGame', () => {
  function playBlock() {
    document.body.innerHTML = `<div class="chess-play"><div class="chess-board"></div><span class="chess-status"></span><button class="chess-reset" type="button">r</button></div>`
    return document.querySelector('.chess-play')
  }
  afterEach(() => { delete window.matchMedia })

  it('builds 64 squares on a fresh block and reset() restores the start position', () => {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('hover'), addEventListener: vi.fn() }))
    const play = playBlock()
    const game = mountChessGame(play)
    const board = play.querySelector('.chess-board')
    expect(board.querySelectorAll('.sq')).toHaveLength(64)
    board.querySelector('[data-sq="e2"]').click()
    board.querySelector('[data-sq="e4"]').click()
    expect(board.querySelector('[data-sq="e4"]').textContent).toBe('♟')
    game.reset()
    expect(board.querySelector('[data-sq="e2"]').textContent).toBe('♟')
    expect(board.querySelector('[data-sq="e4"]').textContent).toBe('')
    game.destroy()
    expect(board.querySelectorAll('.sq')).toHaveLength(0)
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
  it('does not throw when the shelf is absent from the DOM', () => {
    document.body.innerHTML = '<div class="shelf-wall"></div>'
    expect(() => initProjects()).not.toThrow()
  })
})
