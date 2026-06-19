// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor }       from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations }   from './scroll/Animations.js'
import { initHeroLogo }     from './hero/HeroLogo.js'
import { initHero }         from './sections/hero.js'
import { initAbout }        from './sections/about.js'
import { initMdfld }        from './sections/mdfld.js'
import { initProjects }     from './sections/projects.js'
import { initBlog }         from './sections/blog.js'
import { initActivity }     from './sections/activity.js'
import { initContact }      from './sections/contact.js'
import bakedData            from './data/github-activity.json'
import blogPosts            from './data/blog-index.json'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()
initHero()
initAbout()
initMdfld()
initProjects()
initBlog(blogPosts)
initActivity(bakedData)
initContact()
initNpmSection()

// Silently refresh activity data from live API
fetch('/api/github')
  .then(r => r.ok ? r.json() : null)
  .then(liveData => {
    if (liveData && liveData.totalContributions !== bakedData.totalContributions) {
      initActivity(liveData)
    }
  })
  .catch(() => { /* live refresh is best-effort */ })

const NPM_PACKAGES = [
  { name: '@ayo0la/grain-canvas',      desc: 'Animated film grain + particle system. Zero dependencies.', url: 'https://www.npmjs.com/package/@ayo0la/grain-canvas' },
  { name: '@ayo0la/cursor',            desc: 'Self-injecting custom cursor with lerp tracking and click states.', url: 'https://www.npmjs.com/package/@ayo0la/cursor' },
  { name: '@ayo0la/scroll-animations', desc: 'charStagger, wordStagger, scrollFade, staggerCards. GSAP-powered.', url: 'https://www.npmjs.com/package/@ayo0la/scroll-animations' },
]

async function initNpmSection() {
  const el = document.getElementById('activity-npm')
  if (!el) return

  // Render immediately with loading state
  el.innerHTML = `
    <div class="activity-npm-header">
      <span class="mono-tag">// NPM PACKAGES</span>
    </div>
    <div class="activity-npm-list">
      ${NPM_PACKAGES.map(p => `
        <a class="activity-npm-row" href="${p.url}" target="_blank" rel="noopener" data-npm-pkg="${p.name}">
          <div class="activity-npm-info">
            <span class="activity-npm-name">${p.name}</span>
            <span class="activity-npm-desc">${p.desc}</span>
          </div>
          <div class="activity-npm-meta">
            <span class="activity-npm-downloads">—</span>
            <span class="activity-npm-downloads-label">/ week</span>
          </div>
        </a>
      `).join('')}
    </div>
  `

  // Fetch download counts in parallel
  await Promise.all(NPM_PACKAGES.map(async (p) => {
    try {
      const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(p.name)}`)
      if (!res.ok) return
      const data = await res.json()
      const row = el.querySelector(`[data-npm-pkg="${p.name}"] .activity-npm-downloads`)
      if (row) row.textContent = data.downloads.toLocaleString()
    } catch { /* silently fail */ }
  }))
}

const heroLogo = initHeroLogo()

function loop(ts) {
  updateBackgroundCanvas(ts)
  heroLogo?.animate(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
