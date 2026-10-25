import { W, drawLabel, roundRect } from './draw.js'

const REPOS = ['supervision', 'rf-detr', 'imageio']

export function drawOss(ctx, project, { t, playing, data }) {
  const u = (data && data.upstream) || { merged: 0, additions: 0, deletions: 0, stars: 0 }
  ctx.fillStyle = '#0d1117'
  ctx.fillRect(0, 0, W, W)
  const r = playing ? Math.min(1, t / 1.2) : 1
  const e = 1 - Math.pow(1 - r, 3)
  ctx.fillStyle = '#8957e5'
  roundRect(ctx, 26, 34, 170, 38, 19)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 18px system-ui'
  ctx.fillText(`${u.merged} Merged`, 48, 60)
  ctx.font = '800 92px ui-monospace,monospace'
  ctx.fillStyle = '#3fb950'
  ctx.fillText('+' + Math.round(u.additions * e), 22, 175)
  ctx.fillStyle = '#f85149'
  ctx.fillText('−' + Math.round(u.deletions * e), 22, 268)
  ctx.fillStyle = '#8b949e'
  ctx.font = '16px ui-monospace,monospace'
  const n = playing ? 1 + (Math.floor(t * 1.5) % 3) : 3
  ctx.fillText(REPOS.slice(0, n).join(' · '), 26, 312)
  ctx.fillStyle = '#e6edf3'
  ctx.font = '700 22px ui-monospace,monospace'
  ctx.fillText(Math.floor((u.stars * e) / 1000) + 'K ★', 390, 60)
  drawLabel(ctx, project)
}
