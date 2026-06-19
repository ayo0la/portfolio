// src/sections/projects.js
export function initProjects() {
  initExpandableCard('npm-card')
  initExpandableCard('allstar-card')
  fetchNpmDownloads()
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
    document.querySelectorAll(`.project-card:not(#${id})`).forEach(c => c.classList.add('dimmed'))

    outsideHandler = (e) => {
      if (!card.contains(e.target)) collapse()
    }
    // setTimeout(0) prevents the click that triggered expand from immediately firing collapse
    setTimeout(() => { if (outsideHandler) document.addEventListener('click', outsideHandler) }, 0)
  }

  function collapse() {
    card.dataset.expanded = 'false'
    card.setAttribute('aria-expanded', 'false')
    document.querySelectorAll('.project-card.dimmed').forEach(c => c.classList.remove('dimmed'))

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
