import * as THREE from 'three'
import { CAR } from '../utils/Constants.js'

let carGroup  = null
let wheelData = []   // { steerGroup, spinGroup, isFront }

// ── Materials ─────────────────────────────────────────────────────

const chassisMat    = new THREE.MeshLambertMaterial({ color: 0x0d1f2e })
const bodyMat       = new THREE.MeshLambertMaterial({ color: 0x1a3a8f })
const roofMat       = new THREE.MeshLambertMaterial({ color: 0x0d1525 })
const goldMat       = new THREE.MeshBasicMaterial({ color: 0xffd700 })
const wheelMat      = new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
const rimMat        = new THREE.MeshLambertMaterial({ color: 0x8ab0c8 })
const windowMat     = new THREE.MeshBasicMaterial({ color: 0x0a2a4a, transparent: true, opacity: 0.6 })
const lightMat      = new THREE.MeshBasicMaterial({ color: 0xfff5c0 })
const brakeLightMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a })

// ── Wheel builder ─────────────────────────────────────────────────
//
// Hierarchy per wheel:
//   steerGroup  — moves to suspension-compressed position + applies steering yaw
//     spinGroup — spins about X (the axle axis in chassis-local space)
//       tyre / rim / hub — CylinderGeometry rotated 90° around Z so wheel faces sideways

function _makeWheel() {
  const steerGroup = new THREE.Group()
  const spinGroup  = new THREE.Group()
  steerGroup.add(spinGroup)

  const tyre = new THREE.Mesh(
    new THREE.CylinderGeometry(CAR.WHEEL_RADIUS, CAR.WHEEL_RADIUS, CAR.WHEEL_WIDTH, 16),
    wheelMat
  )
  tyre.rotation.z = Math.PI / 2
  spinGroup.add(tyre)

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(CAR.WHEEL_RADIUS * 0.58, CAR.WHEEL_RADIUS * 0.58, CAR.WHEEL_WIDTH * 0.7, 8),
    rimMat
  )
  rim.rotation.z = Math.PI / 2
  spinGroup.add(rim)

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, CAR.WHEEL_WIDTH * 0.74, 6),
    goldMat
  )
  hub.rotation.z = Math.PI / 2
  spinGroup.add(hub)

  return { steerGroup, spinGroup }
}

// ── Build car group ───────────────────────────────────────────────

export function createCarMesh(scene) {
  carGroup  = new THREE.Group()
  wheelData = []

  // Chassis underplate
  const underplate = new THREE.Mesh(
    new THREE.BoxGeometry(CAR.CHASSIS_HX * 2, 0.12, CAR.CHASSIS_HZ * 2),
    chassisMat
  )
  underplate.position.y = -0.08
  carGroup.add(underplate)

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(CAR.CHASSIS_HX * 2, 0.38, CAR.CHASSIS_HZ * 2 * 0.78),
    bodyMat
  )
  body.position.set(0, 0.19, -0.12)
  carGroup.add(body)

  // Cabin roof
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(CAR.CHASSIS_HX * 1.6, 0.28, CAR.CHASSIS_HZ * 1.0),
    roofMat
  )
  cabin.position.set(0, 0.52, -0.05)
  carGroup.add(cabin)

  // Windscreen
  const windscreen = new THREE.Mesh(
    new THREE.BoxGeometry(CAR.CHASSIS_HX * 1.5, 0.28, 0.05),
    windowMat
  )
  windscreen.position.set(0, 0.5, -(CAR.CHASSIS_HZ * 0.78 / 2 + 0.05))
  carGroup.add(windscreen)

  // Rear glass
  const rearscreen = new THREE.Mesh(
    new THREE.BoxGeometry(CAR.CHASSIS_HX * 1.5, 0.25, 0.05),
    windowMat
  )
  rearscreen.position.set(0, 0.5, CAR.CHASSIS_HZ * 0.78 / 2 + 0.05)
  carGroup.add(rearscreen)

  // MDFLD gold stripe along sides
  ;[-1, 1].forEach(side => {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.08, CAR.CHASSIS_HZ * 2 * 0.72),
      goldMat
    )
    stripe.position.set(side * (CAR.CHASSIS_HX + 0.02), 0.18, -0.12)
    carGroup.add(stripe)
  })

  // Front logo plate
  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.03), goldMat)
  frontPlate.position.set(0, 0.04, -(CAR.CHASSIS_HZ + 0.02))
  carGroup.add(frontPlate)

  // Headlights
  ;[-0.5, 0.5].forEach(ox => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.04), lightMat)
    light.position.set(ox, 0.18, -(CAR.CHASSIS_HZ + 0.03))
    carGroup.add(light)
  })

  // Brake lights
  ;[-0.5, 0.5].forEach(ox => {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.04), brakeLightMat)
    bl.position.set(ox, 0.18, CAR.CHASSIS_HZ + 0.03)
    carGroup.add(bl)
  })

  // Wheels
  CAR.WHEELS.forEach(w => {
    const { steerGroup, spinGroup } = _makeWheel()
    steerGroup.position.set(w.x, w.y, w.z)
    carGroup.add(steerGroup)
    wheelData.push({ steerGroup, spinGroup, isFront: w.front })
  })

  scene.add(carGroup)
  return carGroup
}

// ── Per-frame sync ────────────────────────────────────────────────

export function updateCarMesh(chassisBody, vehicle) {
  if (!carGroup) return

  const t = chassisBody.translation()
  const r = chassisBody.rotation()
  carGroup.position.set(t.x, t.y, t.z)
  carGroup.quaternion.set(r.x, r.y, r.z, r.w)

  wheelData.forEach(({ steerGroup, spinGroup, isFront }, i) => {
    const connPt  = vehicle.wheelChassisConnectionPointCs(i)
    const suspLen = vehicle.wheelSuspensionLength(i)
    const steer   = vehicle.wheelSteering(i)
    const spin    = vehicle.wheelRotation(i)

    // Position: connection point offset down by current suspension length
    steerGroup.position.set(connPt.x, connPt.y - suspLen, connPt.z)

    // Steering yaw (front wheels only)
    steerGroup.rotation.y = isFront ? steer : 0

    // Roll spin about the axle (X axis in steerGroup local space)
    spinGroup.rotation.x = spin
  })
}

export function getCarGroup() { return carGroup }
