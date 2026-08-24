// src/sections/projects.js

export function initProjects() {
  initFlipCards()
  initPointerTilt()
  initShelfIndex()
  fetchNpmDownloads()
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
      // Links on the back face navigate; they never toggle the flip
      if (e.target.closest('a')) return
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
