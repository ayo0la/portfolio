// src/hero/HeroLogo.js
import * as THREE from 'three'

// ── SVG → Three.js coordinate conversion ────────────────────
// SVG viewBox 0 0 48 48, centre is (24, 24)
// x_3d = (x / 24) - 1
// y_3d = -((y / 24) - 1)   ← flip Y axis
function pt(x, y) {
  return new THREE.Vector3(x / 24 - 1, -((y / 24) - 1), 0)
}

// Outer polygon (from SVG path M...Z)
const OUTLINE = [
  [20, 6], [28, 6], [32, 10], [32, 16], [30, 20], [34, 26],
  [32, 34], [28, 40], [24, 42], [20, 38], [16, 32], [14, 26],
  [16, 20], [14, 14], [16, 10],
]

// Inner node circles (cx, cy from SVG <circle> elements)
const NODES = [
  [24, 13],
  [30, 21],
  [21, 30],
  [17, 20],
]

// Connections between node indices (matching SVG <line> elements)
const EDGES = [
  [0, 1], // (24,13) → (30,21)
  [1, 2], // (30,21) → (21,30)
  [3, 0], // (17,20) → (24,13)
]

function buildGroup() {
  const group = new THREE.Group()

  // Closed polygon outline
  const outlinePts = [
    ...OUTLINE.map(([x, y]) => pt(x, y)),
    pt(...OUTLINE[0]), // close the loop
  ]
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePts),
    new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.65 }),
  ))

  // Inner node spheres
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })
  const nodeVec = NODES.map(([x, y]) => pt(x, y))
  nodeVec.forEach(pos => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      nodeMat,
    )
    mesh.position.copy(pos)
    group.add(mesh)
  })

  // Connection lines between nodes
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.5 })
  EDGES.forEach(([a, b]) => {
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([nodeVec[a].clone(), nodeVec[b].clone()]),
      edgeMat,
    ))
  })

  return group
}

export function initHeroLogo() {
  const canvasEl = document.getElementById('logo-canvas')
  if (!canvasEl) return null

  const isMobile = window.innerWidth < 768
  const SIZE     = isMobile ? 120 : 220

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(SIZE, SIZE)

  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 3.5

  const group = buildGroup()
  scene.add(group)

  window.addEventListener('resize', () => {
    const s = window.innerWidth < 768 ? 120 : 220
    renderer.setSize(s, s)
  })

  // animate receives the raw timestamp (ms) from the rAF loop.
  // Using raw timestamp for consistent period regardless of frame rate.
  function animate(ts) {
    const t = ts / 1000 // seconds
    group.rotation.y  = t * 0.4           // full rotation every ~15.7 s
    group.position.y  = Math.sin(t) * 0.08 // float period ~6.3 s
    renderer.render(scene, camera)
  }

  return { animate }
}
