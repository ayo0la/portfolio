import * as THREE from 'three'

/** Flat canvas texture for UI panels, labels, metrics */
export function makeCanvasTexture(w, h, drawFn) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  drawFn(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex._canvas = canvas   // keep ref for updates
  return tex
}

/** Re-draw a CanvasTexture in-place */
export function updateCanvasTexture(tex, drawFn) {
  const canvas = tex._canvas
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawFn(ctx, canvas.width, canvas.height)
  tex.needsUpdate = true
}

/** Sprite label floating above an object */
export function makeLabel(text, color = '#ffffff', bgColor = 'rgba(0,0,0,0.55)') {
  const tex = makeCanvasTexture(512, 80, (ctx, w, h) => {
    ctx.fillStyle = bgColor
    const r = 12
    ctx.beginPath()
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0)
    ctx.quadraticCurveTo(w, 0, w, r)
    ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h)
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r)
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = color
    ctx.font = 'bold 30px Orbitron, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2)
  })
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(3, 0.5, 1)
  return sprite
}

/** A simple rounded-rect info card PlaneGeometry with canvas face */
export function makeInfoCard(w, h, title, body, accentColor = '#ffd700') {
  const geo = new THREE.PlaneGeometry(w, h)
  const tex = makeCanvasTexture(512, Math.round(512 * (h / w)), (ctx, cw, ch) => {
    // Background
    ctx.fillStyle = 'rgba(6,10,20,0.92)'
    ctx.fillRect(0, 0, cw, ch)
    // Accent bar
    ctx.fillStyle = accentColor
    ctx.fillRect(0, 0, 4, ch)
    // Title
    ctx.fillStyle = accentColor
    ctx.font = 'bold 28px Orbitron, sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText(title, 24, 24)
    // Body text — word-wrap
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '20px Inter, sans-serif'
    wrapText(ctx, body, 24, 80, cw - 40, 28)
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, cw - 2, ch - 2)
  })
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  return new THREE.Mesh(geo, mat)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, y)
      line = words[i] + ' '
      y += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, y)
}

/** Line geometry for pitch markings */
export function makeLine(points, color = 0xffffff) {
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  const mat = new THREE.LineBasicMaterial({ color })
  return new THREE.Line(geo, mat)
}

/** Thin flat box for pitch lines */
export function makePitchLine(x, z, w, d) {
  const geo = new THREE.PlaneGeometry(w, d)
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(x, 0.01, z)
  return mesh
}
