// src/sections/projects.js
import { Chess } from 'chess.js'

export function initProjects() {
  initFlipCards()
  initPointerTilt()
  initCoverScenes()
  initChessGame()
  initShelfIndex()
  fetchNpmDownloads()
}

/* ── Cover scenes — the art inside each cover reacts to the cursor ── */

const mathScene = {
  move(front, nx, ny, e) {
    front.querySelectorAll('.glyph').forEach((glyph) => {
      const r = glyph.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      let dx = cx - e.clientX
      let dy = cy - e.clientY
      const dist = Math.max(Math.hypot(dx, dy), 20)
      const push = Math.min(1400 / dist, 26)
      dx = (dx / dist) * push
      dy = (dy / dist) * push
      glyph.classList.add('steered')
      glyph.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
    })
  },
  leave(front) {
    front.querySelectorAll('.glyph').forEach((glyph) => {
      glyph.classList.remove('steered')
      glyph.style.transform = ''
    })
  },
}

function makeMatchdayScene() {
  let timer = null
  let extra = 4
  return {
    move(front) {
      if (timer) return
      const clock = front.querySelector('.md-clock')
      if (!clock) return
      timer = setInterval(() => {
        extra += 1
        clock.textContent = `90'+${extra}`
        if (extra >= 9) {
          clock.textContent = 'FT 2–1'
          clearInterval(timer)
          timer = null
        }
      }, 650)
    },
    leave(front) {
      const clock = front.querySelector('.md-clock')
      if (timer) clearInterval(timer)
      timer = null
      extra = 4
      if (clock) clock.textContent = "90'+4"
    },
  }
}

const allstarScene = {
  move(front, nx, ny, e) {
    const blocks = [...front.querySelectorAll('.block')]
    if (!blocks.length) return
    let nearest = null
    let best = Infinity
    blocks.forEach((block) => {
      const r = block.getBoundingClientRect()
      const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY)
      if (d < best) { best = d; nearest = block }
    })
    blocks.forEach((block) => {
      block.classList.add('steered')
      block.style.transform = block === nearest ? 'translateY(-18%) rotate(-5deg) scale(1.1)' : ''
    })
    const star = front.querySelector('.allstar-star')
    if (star) {
      star.classList.add('steered')
      star.style.transform = `translate(${((nx - 0.5) * 26).toFixed(0)}px, ${((ny - 0.5) * 26).toFixed(0)}px) rotate(${(nx * 180).toFixed(0)}deg)`
    }
  },
  leave(front) {
    front.querySelectorAll('.block, .allstar-star').forEach((el) => {
      el.classList.remove('steered')
      el.style.transform = ''
    })
  },
}

const ossScene = {
  move(front, nx, ny) {
    const star = front.querySelector('.motif-star')
    if (!star) return
    star.classList.add('steered')
    star.style.transform = `translate(${((nx - 0.5) * 22).toFixed(0)}px, ${((ny - 0.5) * 22).toFixed(0)}px) scale(1.15)`
  },
  leave(front) {
    const star = front.querySelector('.motif-star')
    if (!star) return
    star.classList.remove('steered')
    star.style.transform = ''
  },
}

const fanScene = {
  move(front, nx, ny, e) {
    const imgs = [...front.querySelectorAll('.fan img')]
    if (!imgs.length) return
    let nearest = null
    let best = Infinity
    imgs.forEach((img) => {
      const r = img.getBoundingClientRect()
      const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY)
      if (d < best) { best = d; nearest = img }
    })
    imgs.forEach((img) => img.classList.toggle('fan-near', img === nearest))
  },
  leave(front) {
    front.querySelectorAll('.fan img').forEach((img) => img.classList.remove('fan-near'))
  },
}

function initCoverScenes() {
  const hoverFine = window.matchMedia?.('(hover: hover) and (pointer: fine)')
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (!hoverFine?.matches || reduced?.matches) return

  const scenes = {
    'mathtrail-card': mathScene,
    'matchday-card': makeMatchdayScene(),
    'allstar-card': allstarScene,
    'oss-card': ossScene,
    'client-card': fanScene,
  }

  document.querySelectorAll('.shelf-card[data-flipped]').forEach((card) => {
    const front = card.querySelector('.face-front')
    if (!front) return
    const scene = scenes[card.id]

    card.addEventListener('mousemove', (e) => {
      if (card.dataset.flipped === 'true') return
      const r = card.getBoundingClientRect()
      const nx = Math.min(Math.max((e.clientX - r.left) / (r.width || 1), 0), 1)
      const ny = Math.min(Math.max((e.clientY - r.top) / (r.height || 1), 0), 1)
      front.style.setProperty('--mx', nx.toFixed(3))
      front.style.setProperty('--my', ny.toFixed(3))
      scene?.move(front, nx, ny, e)
    })

    card.addEventListener('mouseleave', () => {
      front.style.setProperty('--mx', '0.5')
      front.style.setProperty('--my', '0.5')
      scene?.leave(front)
    })
  })
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
      // are gameplay — neither toggles the flip
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


/* ── Chess Rivals cover — a real playable game (you are white) ── */

const CHESS_GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }

function initChessGame() {
  const play = document.querySelector('#chess-card .chess-play')
  const boardEl = play?.querySelector('.chess-board')
  const statusEl = play?.querySelector('.chess-status')
  const resetEl = play?.querySelector('.chess-reset')
  if (!play || !boardEl) return

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

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text
  }

  function endStatus() {
    if (game.isCheckmate()) return game.turn() === 'b' ? 'MATE — YOU WIN' : 'MATE — GG'
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
    setStatus(endStatus() ?? (game.isCheck() ? 'CHECK — YOUR MOVE' : 'YOUR MOVE'))
  }

  function reset() {
    game.reset()
    if (replyTimer) clearTimeout(replyTimer)
    replyTimer = null
    selected = null
    clearHints()
    render()
    setStatus('YOU PLAY WHITE')
  }

  render()
  setStatus('YOU PLAY WHITE')

  // Gameplay only makes sense with a fine pointer; on touch the board is art
  const hoverFine = window.matchMedia?.('(hover: hover) and (pointer: fine)')
  if (!hoverFine?.matches) return
  play.dataset.live = 'true'

  boardEl.addEventListener('click', (e) => {
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
    }
  })

  resetEl?.addEventListener('click', reset)
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
    } catch {
      // silently fail — downloads just won't show
    }
  }))
}
