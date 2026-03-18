import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PLAYER } from '../utils/Constants.js'

let controls = null
let joystickActive = false
let joystickOrigin = { x: 0, y: 0 }
let joystickDelta = { x: 0, y: 0 }
let camera = null

export function initMobile(cam, domElement) {
  camera = cam

  controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 2
  controls.maxDistance = 120
  controls.maxPolarAngle = Math.PI / 2 - 0.05
  controls.target.set(0, 0, 0)
  controls.update()

  // Show joystick
  document.getElementById('mobile-joystick').classList.add('visible')
  initJoystick()

  return controls
}

function initJoystick() {
  const base = document.getElementById('joystick-base')
  const knob = document.getElementById('joystick-knob')
  if (!base || !knob) return

  const getCenter = () => {
    const r = base.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  base.addEventListener('touchstart', e => {
    e.preventDefault()
    joystickActive = true
    const center = getCenter()
    joystickOrigin = center
  }, { passive: false })

  base.addEventListener('touchmove', e => {
    e.preventDefault()
    if (!joystickActive) return
    const t = e.touches[0]
    const dx = t.clientX - joystickOrigin.x
    const dy = t.clientY - joystickOrigin.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxR = 28
    const clampedDist = Math.min(dist, maxR)
    const angle = Math.atan2(dy, dx)

    joystickDelta.x = Math.cos(angle) * clampedDist / maxR
    joystickDelta.y = Math.sin(angle) * clampedDist / maxR

    knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clampedDist}px), calc(-50% + ${Math.sin(angle) * clampedDist}px))`
  }, { passive: false })

  const endJoystick = () => {
    joystickActive = false
    joystickDelta = { x: 0, y: 0 }
    knob.style.transform = 'translate(-50%, -50%)'
  }
  base.addEventListener('touchend', endJoystick)
  base.addEventListener('touchcancel', endJoystick)
}

export function updateMobile(delta) {
  if (!controls) return
  controls.update()

  if (joystickActive && (joystickDelta.x !== 0 || joystickDelta.y !== 0)) {
    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const right = new THREE.Vector3()
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0))

    const speed = PLAYER.SPEED * delta
    camera.position.addScaledVector(fwd, -joystickDelta.y * speed)
    camera.position.addScaledVector(right, joystickDelta.x * speed)
    controls.target.copy(camera.position).addScaledVector(fwd, 5)
  }
}

export function getMobileControls() { return controls }
