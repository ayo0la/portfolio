// src/sections/projects.js

export function initProjects() {
  initFlipCards()
  initShelfIndex()
  fetchNpmDownloads()
}

function initFlipCards() {
  const cards = document.querySelectorAll('.shelf-card[data-flipped]')
  if (!cards.length) return

  let outsideHandler = null

  function set(card, flipped) {
    card.dataset.flipped = String(flipped)
    card.setAttribute('aria-pressed', String(flipped))
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
