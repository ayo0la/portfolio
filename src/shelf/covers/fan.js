import { W, drawLabel } from './draw.js'
import { usable } from './images.js'

const ROT = [-0.16, 0.13, -0.08, 0.18]
const OFF = [[-40, -30], [40, -36], [-34, 34], [38, 30]]

export function drawFan(ctx, project, { t, playing, images }) {
  ctx.fillStyle = '#1a1712'
  ctx.fillRect(0, 0, W, W)
  const sites = (images && images.sites) || []
  const count = Math.min(4, Math.max(sites.length, 1))
  const front = playing ? Math.floor(t / 1.6) % count : 0
  const order = [0, 1, 2, 3].filter((i) => i !== front).concat([front])
  for (const i of order) {
    const im = sites[i]
    if (!usable(im)) continue
    const isFront = i === front && playing
    ctx.save()
    ctx.translate(256 + OFF[i][0], 230 + OFF[i][1])
    ctx.rotate(ROT[i] * (isFront ? 0.4 : 1))
    const sz = isFront ? 300 : 250
    ctx.shadowColor = 'rgba(0,0,0,.6)'
    ctx.shadowBlur = 24
    ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz)
    ctx.restore()
  }
  drawLabel(ctx, project)
}
