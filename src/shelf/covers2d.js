// Paints the canvas covers of the HTML shelf (2D path) with the same
// drawers the 3D island uses, as a still frame.
import { drawCover } from './covers/draw.js'
import { projectBySlug } from './projects.js'
import upstream from '../data/upstream.json'
import { onNpmDownloads } from '../sections/projects.js'

function paint(canvas, data) {
  const project = projectBySlug(canvas.dataset.cover)
  if (!project) return
  let ctx = null
  try { ctx = canvas.getContext('2d') } catch { /* no canvas support */ }
  if (!ctx) return
  drawCover(ctx, project, { t: 0, playing: false, images: {}, data })
}

export function paintCovers2D(root = document) {
  const canvases = [...root.querySelectorAll('canvas.cover-canvas')]
  const downloads = {}
  const data = () => ({ upstream, downloads })
  canvases.forEach((c) => paint(c, data()))
  // Live npm numbers come from the one fetch initProjects already makes
  onNpmDownloads((map) => {
    Object.assign(downloads, map)
    canvases.filter((c) => c.dataset.cover === 'npm').forEach((c) => paint(c, data()))
  })
}
