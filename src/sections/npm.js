// src/sections/npm.js

export const NPM_PACKAGES = [
  { name: '@ayo0la/grain-canvas',      desc: 'Animated film grain + particle system. Zero dependencies.', url: 'https://www.npmjs.com/package/@ayo0la/grain-canvas' },
  { name: '@ayo0la/cursor',            desc: 'Self-injecting custom cursor with lerp tracking and click states.', url: 'https://www.npmjs.com/package/@ayo0la/cursor' },
  { name: '@ayo0la/scroll-animations', desc: 'charStagger, wordStagger, scrollFade, staggerCards. GSAP-powered.', url: 'https://www.npmjs.com/package/@ayo0la/scroll-animations' },
]

export async function initNpmSection() {
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
            <span class="activity-npm-downloads">-</span>
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
