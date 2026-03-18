import * as THREE from 'three'

export function buildBillboard(scene, { color, lines, position }) {
  // Canvas texture
  const W = 1024, H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = 'rgba(6, 10, 20, 0.88)'
  ctx.roundRect(0, 0, W, H, 18)
  ctx.fill()

  // Color top border
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, 4)

  // Draw lines
  let y = 48
  lines.forEach(({ text, size, bold, color: c }) => {
    if (!text) { y += size || 10; return }
    ctx.font = `${bold ? '700' : '400'} ${size}px "Orbitron", "Inter", sans-serif`
    ctx.fillStyle = c || '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(text, W / 2, y)
    y += size * 1.55
  })

  const texture = new THREE.CanvasTexture(canvas)

  // Billboard plane — 8 × 5 world units
  const BW = 8, BH = 5
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(BW, BH),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  )

  // Post
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 6, 8),
    new THREE.MeshLambertMaterial({ color: 0x2a3545 })
  )

  const group = new THREE.Group()
  post.position.y = 3
  mesh.position.y = 7.5
  group.add(post)
  group.add(mesh)
  group.position.set(...position)

  // Store refs on group for ZoneManager to drive opacity
  group.userData.billboardMesh = mesh
  group.userData.billboardMat  = mesh.material

  scene.add(group)
  return mesh.material   // caller can store for direct opacity control
}
