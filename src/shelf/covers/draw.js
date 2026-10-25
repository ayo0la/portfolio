import { drawScroll } from './scroll.js'
import { drawOss } from './oss.js'
import { drawNpm } from './npm.js'
import { drawChess } from './chess.js'
import { drawFan } from './fan.js'

export const W = 512

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

export const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

// Bottom scrim, tag line and project name. Every kind calls this.
export function drawLabel(ctx, project) {
  // Opaque only behind the tag and name (bottom ~23%); the ramp above it is short but still
  // hides screenshot text sitting right behind the label.
  const g = ctx.createLinearGradient(0, 350, 0, 512)
  g.addColorStop(0, 'rgba(8,8,8,0)')
  g.addColorStop(0.3, 'rgba(8,8,8,.84)')
  g.addColorStop(0.5, 'rgba(8,8,8,.97)')
  g.addColorStop(1, 'rgba(8,8,8,.99)')
  ctx.fillStyle = g
  ctx.fillRect(0, 350, 512, 162)
  ctx.fillStyle = 'rgba(255,255,255,.85)'
  ctx.font = '600 15px ui-monospace,monospace'
  ctx.fillText(project.tag, 26, 448)
  ctx.fillStyle = '#fff'
  ctx.font = '800 40px system-ui,-apple-system,sans-serif'
  ctx.fillText(project.name, 24, 490)
}

// Looked up at call time so the circular imports with the drawers stay safe.
const drawers = () => ({ scroll: drawScroll, oss: drawOss, npm: drawNpm, chess: drawChess, fan: drawFan })

// state: { t, playing, images, data }. Paints a 512x512 square.
export function drawCover(ctx, project, state = {}) {
  const s = { t: 0, playing: false, images: {}, data: {}, ...state }
  ctx.clearRect(0, 0, W, W)
  const fn = drawers()[project.cover.kind]
  if (fn) fn(ctx, project, s)
  else drawLabel(ctx, project)
}
