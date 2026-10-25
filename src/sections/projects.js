// src/sections/projects.js
import { Chess } from 'chess.js'

export function initProjects() {
  initFlipCards()
  initPointerTilt()
  initChessGame()
  initShelfIndex()
  fetchNpmDownloadsOnce()
}

// Editions-style parallax: the cover leans toward the cursor while unflipped
function initPointerTilt() {
  const hoverFine = window.matchMedia?.('(hover: hover) and (pointer: fine)')
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (!hoverFine?.matches || reduced?.matches) return

  document.querySelectorAll('.shelf-card[data-flipped]').forEach((card) => {
    const flipper = card.querySelector('.flipper')
    if (!flipper) return

    card.addEventListener('mousemove', (e) => {
      if (card.dataset.flipped === 'true') return
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      flipper.style.transition = 'transform 0.12s ease-out'
      flipper.style.transform = `rotateX(${(-y * 14).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`
    })

    card.addEventListener('mouseleave', () => {
      if (card.dataset.flipped === 'true') return
      flipper.style.transform = 'rotateX(0deg) rotateY(0deg)'
    })
  })
}

function initFlipCards() {
  const cards = document.querySelectorAll('.shelf-card[data-flipped]')
  if (!cards.length) return

  let outsideHandler = null

  function set(card, flipped) {
    card.dataset.flipped = String(flipped)
    card.setAttribute('aria-pressed', String(flipped))
    // clear inline tilt so the CSS flip transition owns the transform
    const flipper = card.querySelector('.flipper')
    if (flipper) {
      flipper.style.transform = ''
      flipper.style.transition = ''
    }
  }

  function unflipOthers(except) {
    document.querySelectorAll('.shelf-card[data-flipped="true"]').forEach((c) => {
      if (c !== except) set(c, false)
    })
  }

  function detachOutside() {
    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler)
      outsideHandler = null
    }
  }

  function attachOutside() {
    detachOutside()
    // setTimeout(0) prevents the click that flipped the card from immediately unflipping it
    setTimeout(() => {
      outsideHandler = (e) => {
        if (!e.target.closest('.shelf-card[data-flipped="true"]')) {
          unflipOthers(null)
          detachOutside()
        }
      }
      document.addEventListener('click', outsideHandler)
    }, 0)
  }

  cards.forEach((card) => {
    set(card, card.dataset.flipped === 'true')

    const toggle = (e) => {
      // Links on the back face navigate and moves on a live chess board
      // are gameplay, neither toggles the flip
      if (e.target.closest('a, .chess-play[data-live="true"]')) return
      const flipped = card.dataset.flipped === 'true'
      unflipOthers(card)
      set(card, !flipped)
      if (!flipped) attachOutside()
      else detachOutside()
    }

    card.addEventListener('click', toggle)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle(e)
      }
    })
  })
}


/* ── Chess Rivals cover - a real playable game (you are white) ── */

const CHESS_GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }

function initChessGame() {
  const play = document.querySelector('#chess-card .chess-play')
  if (play) mountChessGame(play)
}

// Builds the playable board inside a .chess-play block (board, status and reset children).
// The 2D card and the 3D overlay both use it. Returns { reset, destroy }.
export function mountChessGame(play) {
  const boardEl = play?.querySelector('.chess-board')
  const statusEl = play?.querySelector('.chess-status')
  const resetEl = play?.querySelector('.chess-reset')
  const none = { reset() {}, destroy() {} }
  if (!play || !boardEl) return none

  const game = new Chess()
  const files = 'abcdefgh'
  const squares = {}
  let selected = null
  let replyTimer = null

  for (let rank = 8; rank >= 1; rank--) {
    for (let f = 0; f < 8; f++) {
      const sq = files[f] + rank
      const el = document.createElement('span')
      el.className = 'sq ' + ((f + rank) % 2 === 1 ? 'sq-dark' : 'sq-light')
      el.dataset.sq = sq
      boardEl.appendChild(el)
      squares[sq] = el
    }
  }

  function render() {
    game.board().forEach((row, ri) => {
      row.forEach((cell, fi) => {
        const el = squares[files[fi] + (8 - ri)]
        el.textContent = cell ? CHESS_GLYPHS[cell.type] : ''
        el.classList.toggle('pc-w', !!cell && cell.color === 'w')
        el.classList.toggle('pc-b', !!cell && cell.color === 'b')
      })
    })
  }

  function clearHints() {
    boardEl.querySelectorAll('.sel, .hint').forEach((el) => el.classList.remove('sel', 'hint'))
  }

  function markLastMove() {
    boardEl.querySelectorAll('.last').forEach((el) => el.classList.remove('last'))
    const last = game.history({ verbose: true }).at(-1)
    if (last) {
      squares[last.from]?.classList.add('last')
      squares[last.to]?.classList.add('last')
    }
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text
  }

  function endStatus() {
    if (game.isCheckmate()) return game.turn() === 'b' ? 'MATE · YOU WIN' : 'MATE · GG'
    if (game.isDraw() || game.isStalemate()) return 'DRAW'
    return null
  }

  function blackReply() {
    const moves = game.moves({ verbose: true })
    if (!moves.length) return
    const captures = moves.filter((m) => m.captured)
    const pick = (captures.length ? captures : moves)[Math.floor(Math.random() * (captures.length ? captures.length : moves.length))]
    game.move(pick)
    render()
    markLastMove()
    setStatus(endStatus() ?? (game.isCheck() ? 'CHECK · YOUR MOVE' : 'YOUR MOVE'))
  }

  function reset() {
    game.reset()
    if (replyTimer) clearTimeout(replyTimer)
    replyTimer = null
    selected = null
    clearHints()
    boardEl.querySelectorAll('.last').forEach((el) => el.classList.remove('last'))
    render()
    setStatus('YOU PLAY WHITE · CLICK A GOLD PIECE')
  }

  render()
  setStatus('YOU PLAY WHITE · CLICK A GOLD PIECE')

  // Gameplay only makes sense with a fine pointer; on touch the board is art
  const hoverFine = window.matchMedia?.('(hover: hover) and (pointer: fine)')
  const destroy = () => {
    if (replyTimer) clearTimeout(replyTimer)
    replyTimer = null
    boardEl.removeEventListener('click', onBoardClick)
    resetEl?.removeEventListener('click', reset)
    boardEl.replaceChildren()
    delete play.dataset.live
  }
  if (!hoverFine?.matches) return { reset, destroy }
  play.dataset.live = 'true'

  function onBoardClick(e) {
    const el = e.target.closest('.sq')
    if (!el || game.isGameOver() || game.turn() !== 'w') return
    const sq = el.dataset.sq

    if (selected && el.classList.contains('hint')) {
      game.move({ from: selected, to: sq, promotion: 'q' })
      selected = null
      clearHints()
      render()
      const over = endStatus()
      if (over) return setStatus(over)
      setStatus('BLACK THINKING…')
      replyTimer = setTimeout(blackReply, 550)
      return
    }

    clearHints()
    selected = null
    const piece = game.get(sq)
    if (piece && piece.color === 'w') {
      selected = sq
      el.classList.add('sel')
      game.moves({ square: sq, verbose: true }).forEach((m) => squares[m.to].classList.add('hint'))
    } else if (piece && piece.color === 'b') {
      setStatus('THE GOLD PIECES ARE YOURS')
    }
  }

  boardEl.addEventListener('click', onBoardClick)
  resetEl?.addEventListener('click', reset)
  return { reset, destroy }
}

function initShelfIndex() {
  document.querySelectorAll('.shelf-index [data-target]').forEach((entry) => {
    entry.addEventListener('click', () => {
      const card = document.getElementById(entry.dataset.target)
      if (!card) return
      card.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      card.focus({ preventScroll: true })
    })
  })
}

/* ── npm weekly downloads: one fetch feeds the back-face rows and the 2D npm cover ── */

const npmDownloads = {}
const npmListeners = new Set()

export function getNpmDownloads() {
  return { ...npmDownloads }
}

// Calls fn(downloads) now if anything has arrived, and again on every update
export function onNpmDownloads(fn) {
  npmListeners.add(fn)
  if (Object.keys(npmDownloads).length) fn(getNpmDownloads())
  return () => npmListeners.delete(fn)
}

export function setNpmDownloads(map) {
  Object.assign(npmDownloads, map)
  npmListeners.forEach((fn) => fn(getNpmDownloads()))
}

let npmFetchStarted = false
// The 3D island calls this instead of initProjects(); it shares the same store and fetch.
export function fetchNpmDownloadsOnce() {
  if (npmFetchStarted) return
  npmFetchStarted = true
  return fetchNpmDownloads()
}

async function fetchNpmDownloads() {
  const rows = document.querySelectorAll('[data-npm-pkg]')
  await Promise.all([...rows].map(async (row) => {
    const pkg = row.dataset.npmPkg
    const el = row.querySelector('.npm-row-downloads')
    if (!el) return
    try {
      const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`)
      if (!res.ok) return
      const data = await res.json()
      el.textContent = `${data.downloads.toLocaleString()} / wk`
      setNpmDownloads({ [pkg]: data.downloads })
    } catch {
      // silently fail: downloads just won't show
    }
  }))
}
