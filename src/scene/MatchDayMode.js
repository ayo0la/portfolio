import * as THREE from 'three'
import { setMatchDayLights } from './Floodlights.js'
import { EventBus } from '../utils/EventBus.js'
import { lerp, easeInOutCubic } from '../utils/MathUtils.js'

let active = false
let scene = null
let camera = null
let projectionMesh = null
let isSweeping = false
let sweepT = 0
const SWEEP_DURATION = 32  // seconds for one full orbit

let savedCameraPos = new THREE.Vector3()
let savedCameraRot = new THREE.Euler()

// Broadcast helicopter path — outside the stadium bowl (r ≈ 155-170, h ≈ 55-78).
// Angled ~22-28° below horizontal looking at (0, 10, 0), which shows the
// stadium exterior, roof, and a clear angled view into the interior.
const cinematicPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3( 162,  62,   20),   // east, slight south bias
  new THREE.Vector3(  80,  58,  155),   // NE corner
  new THREE.Vector3(   0,  75,  168),   // due north — highest point for drama
  new THREE.Vector3(-100,  60,  130),   // NW quadrant
  new THREE.Vector3(-168,  64,    0),   // due west
  new THREE.Vector3(-115,  57, -120),   // SW — dips slightly for variety
  new THREE.Vector3(   0,  70, -165),   // due south
  new THREE.Vector3( 118,  60, -118),   // SE corner
  new THREE.Vector3( 162,  62,   20),   // close loop back to east
])
cinematicPath.closed = true

export function initMatchDayMode(sceneRef, cameraRef) {
  scene = sceneRef
  camera = cameraRef
}

export function toggleMatchDay(controlsRef) {
  active = !active
  setMatchDayLights(active)
  document.getElementById('matchday-btn').classList.toggle('active', active)

  if (active) {
    // Save player state
    savedCameraPos.copy(camera.position)
    savedCameraRot.copy(camera.rotation)

    showProjection()
    isSweeping = true
    sweepT = 0
    if (controlsRef?.lock) {
      try { controlsRef.unlock?.() } catch (_) {}
    }
    EventBus.emit('matchday:start')
  } else {
    hideProjection()
    isSweeping = false
    camera.position.copy(savedCameraPos)
    camera.rotation.copy(savedCameraRot)
    EventBus.emit('matchday:end')
  }
}

// Look-at target slightly above pitch centre so interior is visible from outside
const _lookAt = new THREE.Vector3(0, 10, 0)

export function updateMatchDay(delta) {
  if (!isSweeping) return

  // Advance and wrap — keeps orbiting for as long as matchday is active
  sweepT = (sweepT + delta / SWEEP_DURATION) % 1
  const point = cinematicPath.getPointAt(sweepT)

  // Smooth interpolation — gentle follow so sudden activations ease in
  camera.position.lerp(point, 0.035)
  camera.lookAt(_lookAt)

  // Pulse projection
  if (projectionMesh) {
    projectionMesh.material.opacity = 0.55 + Math.sin(Date.now() * 0.002) * 0.15
  }
}

export function isMatchDayActive() { return active }

function showProjection() {
  if (projectionMesh) return

  // Large pitch projection text via canvas texture
  const canvas = document.createElement('canvas')
  canvas.width = 2048; canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, 2048, 512)

  // Glow lines
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 40

  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)'
  ctx.fillRect(0, 0, 2048, 512)

  ctx.shadowColor = '#ffd700'
  ctx.shadowBlur = 24
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 88px Orbitron, Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Building the infrastructure layer', 1024, 180)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = 'bold 72px Orbitron, Arial'
  ctx.fillText('for global football commerce.', 1024, 320)

  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(0,229,255,0.4)'
  ctx.font = '32px Inter, Arial'
  ctx.fillText('MDFLD  ·  AYOOLA MORAKINYO  ·  2025', 1024, 430)

  const tex = new THREE.CanvasTexture(canvas)
  projectionMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 22),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
  )
  projectionMesh.rotation.x = -Math.PI / 2
  projectionMesh.position.set(0, 0.08, -8)
  scene.add(projectionMesh)
}

function hideProjection() {
  if (!projectionMesh) return
  scene.remove(projectionMesh)
  projectionMesh.geometry.dispose()
  projectionMesh.material.dispose()
  projectionMesh = null
}
