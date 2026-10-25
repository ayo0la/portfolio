import { W, drawLabel, easeIO } from './draw.js'
import { usable } from './images.js'

export function drawScroll(ctx, project, { t, playing, images }) {
  ctx.fillStyle = '#0b0f0c'
  ctx.fillRect(0, 0, W, W)
  const im = images && images.tall
  if (usable(im)) {
    const scale = W / im.naturalWidth
    const h = im.naturalHeight * scale
    const cycle = (t % 7) / 7
    let k = cycle < 0.45 ? easeIO(cycle / 0.45) : cycle < 0.6 ? 1 : 1 - easeIO((cycle - 0.6) / 0.4)
    if (!playing) k = 0
    const y = k === 0 ? 0 : -(h - W) * k
    ctx.drawImage(im, 0, y, W, h)
  }
  drawLabel(ctx, project)
}
