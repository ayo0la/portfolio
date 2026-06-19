// src/sections/blog.js
import { escapeHtml } from '../utils/escape-html.js'

export function initBlog(posts) {
  const section = document.getElementById('blog')
  if (!section) return

  if (!posts || posts.length === 0) {
    section.remove()
    return
  }

  const cardsEl = section.querySelector('#blog-cards')
  cardsEl.innerHTML = posts.map(p => `
    <a class="project-card" href="/blog/${escapeHtml(p.slug)}/">
      <span class="proj-tag">${escapeHtml(p.dateDisplay)}</span>
      <h3 class="proj-name">${escapeHtml(p.title)}</h3>
      <p class="proj-desc">${escapeHtml(p.tldr)}</p>
      <span class="proj-arrow">→</span>
    </a>
  `).join('')
}
