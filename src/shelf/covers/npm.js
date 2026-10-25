import { W, drawLabel } from './draw.js'

const PREFIX = '@ayo0la/'

export function drawNpm(ctx, project, { t, playing, data }) {
  const downloads = (data && data.downloads) || {}
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, W, W)
  ctx.fillStyle = '#cb3837'
  ctx.fillRect(0, 0, W, 10)
  const full = '$ npm i @ayo0la/*'
  const n = playing ? Math.min(full.length, Math.floor(t * 14)) : full.length
  const caret = playing && n < full.length && ((t * 3) | 0) % 2 ? '▍' : ''
  ctx.font = '600 26px ui-monospace,monospace'
  ctx.fillStyle = '#e6e6e6'
  ctx.fillText(full.slice(0, n) + caret, 26, 80)
  if (!playing || t > 1.5) {
    const pkgs = project.tracks.filter((tr) => tr.npmPkg)
    ctx.fillStyle = '#3fb950'
    ctx.fillText(`✓ added ${pkgs.length} packages`, 26, 124)
    ctx.font = '18px ui-monospace,monospace'
    pkgs.forEach((tr, i) => {
      const y = 180 + i * 36
      ctx.fillStyle = '#9a9a9a'
      ctx.fillText(tr.npmPkg.replace(PREFIX, ''), 26, y)
      const d = downloads[tr.npmPkg]
      if (Number.isFinite(d) && d > 0) {
        const r = playing ? Math.max(0, Math.min(1, t - 1.5 - i * 0.2)) : 1
        const shown = Math.round(d * r)
        if (shown > 0) {
          ctx.fillStyle = '#e6e6e6'
          ctx.fillText(`${shown}/wk`, 380, y)
        }
      }
    })
  }
  drawLabel(ctx, project)
}
