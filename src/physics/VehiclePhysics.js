/**
 * VehiclePhysics — Rapier DynamicRayCastVehicleController
 * Bruno Simon folio-2025 style toy-car feel.
 *
 * Forward direction in chassis-local space = -Z.
 * Engine force applied to all 4 wheels (AWD).
 * Steering on front wheels only (indices 0 & 1).
 */
import { CAR } from '../utils/Constants.js'

let vehicleRef = null
let chassisBodyRef = null
let currentSteer = 0

// ── Creation ────────────────────────────────────────────────────

export function createVehicle(RAPIER, world) {
  // ── Chassis rigid body ──────────────────────────────────────
  const chassisDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(CAR.SPAWN_X, CAR.SPAWN_Y, CAR.SPAWN_Z)
    .setLinearDamping(0.55)    // higher → car decelerates sharply when key released
    .setAngularDamping(5.0)    // heavier yaw damping → no spin-outs
    .setAdditionalMass(CAR.CHASSIS_MASS)

  chassisBodyRef = world.createRigidBody(chassisDesc)

  // Low-profile box — centre of mass slightly below geometric centre for stability
  const colliderDesc = RAPIER.ColliderDesc
    .cuboid(CAR.CHASSIS_HX, CAR.CHASSIS_HY, CAR.CHASSIS_HZ)
    .setTranslation(0, -0.05, 0)   // shift CoM slightly down
    .setFriction(0.3)
    .setRestitution(0.05)

  world.createCollider(colliderDesc, chassisBodyRef)

  // ── Vehicle controller ──────────────────────────────────────
  vehicleRef = world.createVehicleController(chassisBodyRef)

  const suspDir  = new RAPIER.Vector3(0, -1, 0)
  const axleAxis = new RAPIER.Vector3(-1, 0, 0)

  CAR.WHEELS.forEach(w => {
    const connPt = new RAPIER.Vector3(w.x, w.y, w.z)
    vehicleRef.addWheel(connPt, suspDir, axleAxis, CAR.SUSP_REST_LEN, CAR.WHEEL_RADIUS)
  })

  // Tune each wheel identically (toy-car tuning from brief)
  for (let i = 0; i < 4; i++) {
    vehicleRef.setWheelSuspensionStiffness(i,   CAR.SUSP_STIFFNESS)
    vehicleRef.setWheelSuspensionRestLength(i,  CAR.SUSP_REST_LEN)
    vehicleRef.setWheelMaxSuspensionTravel(i,   CAR.SUSP_MAX_TRAVEL)
    vehicleRef.setWheelSuspensionCompression(i, CAR.SUSP_COMPRESSION)
    vehicleRef.setWheelSuspensionRelaxation(i,  CAR.SUSP_RELAXATION)
    vehicleRef.setWheelMaxSuspensionForce(i,    CAR.SUSP_MAX_FORCE)
    vehicleRef.setWheelFrictionSlip(i,          CAR.FRICTION_SLIP)
    vehicleRef.setWheelSideFrictionStiffness(i, CAR.SIDE_FRICTION)
  }

  return { vehicle: vehicleRef, chassisBody: chassisBodyRef }
}

// ── Per-frame update (pre-physics stage) ────────────────────────

export function applyVehicleInput(input, dt) {
  if (!vehicleRef) return

  const { forward, back, left, right, brake, boost } = input

  // Engine force
  let force = 0
  if (forward) force =  CAR.ENGINE_FORCE * (boost ? CAR.BOOST_MULT : 1)
  if (back)    force = -CAR.REVERSE_FORCE

  // Smooth steering (lerp toward target angle) — faster response than before
  const steerTarget = left ? CAR.MAX_STEER : right ? -CAR.MAX_STEER : 0
  currentSteer += (steerTarget - currentSteer) * Math.min(1, 18 * dt)

  // Apply to each wheel
  for (let i = 0; i < 4; i++) {
    vehicleRef.setWheelEngineForce(i, brake ? 0 : force)
    vehicleRef.setWheelBrake(i, brake ? CAR.BRAKE_FORCE : (force === 0 ? CAR.IDLE_BRAKE : 0))
  }
  // Front-wheel steering
  vehicleRef.setWheelSteering(0, currentSteer)
  vehicleRef.setWheelSteering(1, currentSteer)

  vehicleRef.updateVehicle(dt)
}

export function getVehicle()      { return vehicleRef }
export function getChassisBody()  { return chassisBodyRef }
export function getVehicleSpeed() { return vehicleRef?.currentVehicleSpeed() ?? 0 }
