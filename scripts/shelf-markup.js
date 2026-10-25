// scripts/shelf-markup.js
// Generates the Other Work shelf (cards + index row + 3D mount point) from
// src/shelf/projects.js, so the data module is the single source of truth.
// The output is baked into index.html between the shelf markers, which keeps
// the 2D shelf working as the no-JS, SEO and WebGL fallback layer.
import { escapeHtml as esc } from '../src/utils/escape-html.js'
import UPSTREAM from '../src/data/upstream.json' with { type: 'json' }


export const SHELF_START = '<!-- shelf:start -->'
export const SHELF_END = '<!-- shelf:end -->'

const I = (n) => ' '.repeat(n)

// Text for assistive tech and for the static HTML when a cover is a canvas
function canvasLabel(project) {
  if (project.cover.kind === 'oss') {
    const k = `${Math.round(UPSTREAM.stars / 1000)}K`
    return `${project.name}: ${k} combined stars, ${project.sticker}. ${project.pitch}`
  }
  return `${project.name}: ${project.pitch}`
}

function renderFront(p) {
  const labels = `
${I(18)}<span class="cover-tag">${esc(p.tag)}</span>
${I(18)}<span class="cover-sticker" aria-hidden="true">${esc(p.sticker)}</span>
${I(18)}<span class="cover-name">${esc(p.name)}</span>
${I(18)}<span class="cover-pill">FLIP ↻</span>
${I(18)}<span class="cover-pitch">${esc(p.pitch)}</span>`

  switch (p.cover.kind) {
    case 'scroll':
      return `${I(16)}<div class="face face-front cover-shot">
${I(18)}<img class="cover-still" src="${esc(p.cover.still)}" alt="${esc(p.name)}" loading="lazy">
${I(18)}<div class="cover-scrim"></div>${labels}
${I(16)}</div>`
    case 'oss':
    case 'npm':
      return `${I(16)}<div class="face face-front cover-art">
${I(18)}<canvas class="cover-canvas" data-cover="${esc(p.slug)}" width="512" height="512" role="img" aria-label="${esc(canvasLabel(p))}">${esc(canvasLabel(p))}</canvas>${labels}
${I(16)}</div>`
    case 'chess':
      return `${I(16)}<div class="face face-front cover-gen cover-chess">
${I(18)}<div class="cover-motif chess-play">
${I(20)}<div class="chess-board" aria-label="Playable chess board"></div>
${I(20)}<span class="chess-status" aria-live="polite"></span>
${I(20)}<button class="chess-reset" type="button" aria-label="Reset the game" title="Reset">↺</button>
${I(18)}</div>${labels}
${I(16)}</div>`
    case 'fan':
      return `${I(16)}<div class="face face-front cover-fan">
${I(18)}<div class="fan" aria-hidden="true">
${p.cover.sites.map((s) => `${I(20)}<img class="cover-still" src="${esc(s.still)}" alt="${esc(s.alt)}" loading="lazy">`).join('\n')}
${I(18)}</div>
${I(18)}<div class="cover-scrim"></div>${labels}
${I(16)}</div>`
    default:
      throw new Error(`Unknown cover kind: ${p.cover.kind}`)
  }
}

function renderTrack(t) {
  const meta = t.npmPkg
    ? `<span class="track-meta npm-row-downloads" aria-label="Weekly downloads"></span>`
    : `<span class="track-meta">${esc(t.meta ?? '')}</span>`
  const inner = `<span class="track-name">${esc(t.name)}</span>${t.href ? `\n${I(22)}` : ''}${meta}`
  if (!t.href) return `${I(18)}<span class="track">${inner}</span>`
  const npm = t.npmPkg ? ` data-npm-pkg="${esc(t.npmPkg)}"` : ''
  return `${I(18)}<a class="track" href="${esc(t.href)}" target="_blank" rel="noopener"${npm}>
${I(22)}${inner}
${I(18)}</a>`
}

function renderBack(p) {
  const open = p.link
    ? `\n${I(20)}<a class="back-open" href="${esc(p.link.href)}" target="_blank" rel="noopener">${esc(p.link.label)} →</a>`
    : ''
  return `${I(16)}<div class="face face-back">
${I(18)}<p class="back-blurb">${esc(p.blurb)}</p>
${I(18)}<div class="track-list">
${p.tracks.map(renderTrack).join('\n')}
${I(18)}</div>
${I(18)}<div class="back-footer">
${I(20)}<span class="back-credit">AYO0LA · SHELF '26</span>${open}
${I(18)}</div>
${I(16)}</div>`
}

function renderCard(p) {
  return `${I(10)}<div class="shelf-card" id="${esc(p.cardId)}" data-slug="${esc(p.slug)}" data-flipped="false" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(p.ariaLabel)}">
${I(12)}<div class="cover">
${I(14)}<div class="flipper">
${renderFront(p)}
${renderBack(p)}
${I(14)}</div>
${I(12)}</div>
${I(10)}</div>`
}

function renderIndexEntry(p) {
  return `${I(8)}<button class="shelf-index-entry" type="button" data-target="${esc(p.cardId)}">
${I(10)}<span class="sie-year">${esc(String(p.year))}</span>
${I(10)}<span class="sie-cat">${esc(p.category)}</span>
${I(10)}<span class="sie-name">${esc(p.name)}</span>
${I(8)}</button>`
}

export function renderShelfHtml(projects) {
  const rows = []
  for (let i = 0; i < projects.length; i += 4) rows.push(projects.slice(i, i + 4))
  return `${I(6)}<div class="shelf-wall">
${rows.map((row) => `${I(8)}<div class="shelf-row">
${row.map(renderCard).join('\n\n')}
${I(8)}</div>`).join('\n\n')}
${I(6)}</div>

${I(6)}<div class="shelf-index">
${projects.map(renderIndexEntry).join('\n')}
${I(6)}</div>

${I(6)}<div id="shelf-3d" aria-hidden="true"></div>`
}

const SHELF_BLOCK = /(<!-- shelf:start -->)[\s\S]*?(<!-- shelf:end -->)/

export function injectShelf(html, projects) {
  if (!SHELF_BLOCK.test(html)) throw new Error('shelf markers not found in index.html')
  return html.replace(SHELF_BLOCK, (_, start, end) => `${start}\n${renderShelfHtml(projects)}\n${I(6)}${end}`)
}
