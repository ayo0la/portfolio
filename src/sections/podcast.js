// src/sections/podcast.js
import { escapeHtml } from '../utils/escape-html.js'

export function initPodcast(episodes) {
  const section = document.getElementById('podcast')
  if (!section) return

  if (!episodes || episodes.length === 0) {
    section.remove()
    return
  }

  const cardsEl = section.querySelector('#podcast-cards')
  cardsEl.innerHTML = episodes.map(e => `
    <a class="project-card" href="/podcast/${escapeHtml(e.slug)}/">
      <span class="proj-tag">${escapeHtml(e.dateDisplay)}</span>
      <h3 class="proj-name">${escapeHtml(e.title)}</h3>
      <p class="proj-desc">${escapeHtml(e.tldr)}</p>
      <span class="proj-arrow">→</span>
    </a>
  `).join('')
}
