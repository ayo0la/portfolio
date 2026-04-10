// src/sections/projects.js
export function initProjects() {
  const npmCard = document.getElementById('npm-card')
  if (!npmCard) return

  npmCard.setAttribute('aria-expanded', npmCard.dataset.expanded)

  let outsideHandler = null

  npmCard.addEventListener('click', () => {
    const isExpanded = npmCard.dataset.expanded === 'true'
    isExpanded ? collapse() : expand()
  })

  npmCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const isExpanded = npmCard.dataset.expanded === 'true'
      isExpanded ? collapse() : expand()
    }
  })

  function expand() {
    npmCard.dataset.expanded = 'true'
    npmCard.setAttribute('aria-expanded', 'true')
    document.querySelectorAll('.project-card:not(#npm-card)').forEach(c => c.classList.add('dimmed'))

    outsideHandler = (e) => {
      if (!npmCard.contains(e.target)) collapse()
    }
    // setTimeout(0) prevents the click that triggered expand from immediately firing collapse
    setTimeout(() => { if (outsideHandler) document.addEventListener('click', outsideHandler) }, 0)
  }

  function collapse() {
    npmCard.dataset.expanded = 'false'
    npmCard.setAttribute('aria-expanded', 'false')
    document.querySelectorAll('.project-card.dimmed').forEach(c => c.classList.remove('dimmed'))

    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler)
      outsideHandler = null
    }
  }

  fetchNpmDownloads()
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
