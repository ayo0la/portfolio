// src/sections/projects.js
const EXPANDABLE_CARDS = ['npm-card', 'allstar-card', 'oss-card', 'client-card']

export function initProjects() {
  EXPANDABLE_CARDS.forEach(initExpandableCard)
  initShelfIndex()
  fetchNpmDownloads()
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

function initExpandableCard(id) {
  const card = document.getElementById(id)
  if (!card) return

  card.setAttribute('aria-expanded', card.dataset.expanded)

  let outsideHandler = null

  card.addEventListener('click', () => {
    const isExpanded = card.dataset.expanded === 'true'
    isExpanded ? collapse() : expand()
  })

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const isExpanded = card.dataset.expanded === 'true'
      isExpanded ? collapse() : expand()
    }
  })

  function expand() {
    card.dataset.expanded = 'true'
    card.setAttribute('aria-expanded', 'true')
    document.querySelectorAll(`.shelf-card:not(#${id})`).forEach(c => c.classList.add('dimmed'))

    outsideHandler = (e) => {
      if (!card.contains(e.target)) collapse()
    }
    // setTimeout(0) prevents the click that triggered expand from immediately firing collapse
    setTimeout(() => { if (outsideHandler) document.addEventListener('click', outsideHandler) }, 0)
  }

  function collapse() {
    card.dataset.expanded = 'false'
    card.setAttribute('aria-expanded', 'false')
    document.querySelectorAll('.shelf-card.dimmed').forEach(c => c.classList.remove('dimmed'))

    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler)
      outsideHandler = null
    }
  }
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
