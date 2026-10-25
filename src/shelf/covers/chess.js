import { W, drawLabel, roundRect } from './draw.js'
import { OPERA_GAME } from '../opera-game.js'

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const cell = (n) => ['abcdefgh'.indexOf(n[0]), 8 - Number(n[1])]

export function drawChess(ctx, project, { t, playing }) {
  const last = OPERA_GAME.length - 1
  ctx.fillStyle = '#07100d'
  ctx.fillRect(0, 0, W, W)
  const glow = ctx.createRadialGradient(150, 120, 10, 150, 120, 330)
  glow.addColorStop(0, 'rgba(16,185,129,.28)')
  glow.addColorStop(1, 'rgba(16,185,129,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, W)
  const idx = playing ? Math.min(last, Math.floor(t / 0.75)) : last
  const { fen, from, to } = OPERA_GAME[idx]
  const bx = 24, by = 24, bs = 300, sq = bs / 8
  ctx.save()
  roundRect(ctx, bx, by, bs, bs, 10)
  ctx.clip()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = (r + c) % 2 ? '#1f4d3d' : '#cfe3d6'
      ctx.fillRect(bx + c * sq, by + r * sq, sq, sq)
    }
  }
  if (from) {
    for (const n of [from, to]) {
      const [c, r] = cell(n)
      ctx.fillStyle = 'rgba(52,211,153,.55)'
      ctx.fillRect(bx + c * sq, by + r * sq, sq, sq)
    }
  }
  ctx.font = `${sq * 0.86}px "Apple Symbols","Segoe UI Symbol",serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 2.2
  fen.split('/').forEach((row, r) => {
    let c = 0
    for (const ch of row) {
      if (/\d/.test(ch)) { c += +ch; continue }
      const x = bx + c * sq + sq / 2
      const y = by + r * sq + sq / 2 + 2
      const white = ch === ch.toUpperCase()
      ctx.fillStyle = white ? '#ffffff' : '#0b0f0e'
      ctx.strokeStyle = white ? '#0b0f0e' : 'rgba(255,255,255,.35)'
      ctx.strokeText(GLYPH[ch.toLowerCase()], x, y)
      ctx.fillText(GLYPH[ch.toLowerCase()], x, y)
      c++
    }
  })
  ctx.restore()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.strokeStyle = 'rgba(52,211,153,.35)'
  ctx.lineWidth = 1.5
  roundRect(ctx, bx, by, bs, bs, 10)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,255,255,.05)'
  roundRect(ctx, 340, 24, 148, 300, 10)
  ctx.fill()
  ctx.fillStyle = '#6ee7b7'
  ctx.font = '600 12px ui-monospace,monospace'
  ctx.fillText('MOVES', 354, 48)
  ctx.font = '15px ui-monospace,monospace'
  const first = Math.max(1, idx - 11)
  for (let k = first, line = 0; k <= idx; k++, line++) {
    const no = Math.ceil(k / 2)
    ctx.fillStyle = k === idx ? '#ffffff' : 'rgba(255,255,255,.55)'
    ctx.fillText((k % 2 === 1 ? no + '. ' : '   ') + OPERA_GAME[k].san, 354, 74 + line * 20)
  }
  if (idx === last) {
    ctx.fillStyle = '#10b981'
    roundRect(ctx, 354, 290, 120, 24, 12)
    ctx.fill()
    ctx.fillStyle = '#04120c'
    ctx.font = '700 12px system-ui'
    ctx.fillText('CHECKMATE', 376, 307)
  }
  ctx.fillStyle = 'rgba(255,255,255,.5)'
  ctx.font = '12px ui-monospace,monospace'
  ctx.fillText('Morphy vs Duke & Count · Paris 1858', 24, 350)
  drawLabel(ctx, project)
}
