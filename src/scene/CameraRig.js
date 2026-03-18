import * as THREE from 'three'
import { CAR } from '../utils/Constants.js'

// Spring chase camera — 3rd person follow rig

const _targetPos  = new THREE.Vector3()
const _currentPos = new THREE.Vector3()
const _lookAt     = new THREE.Vector3()
const _carUp      = new THREE.Vector3()
const _carFwd     = new THREE.Vector3()
const _offset     = new THREE.Vector3()
const _chassisQuat = new THREE.Quaternion()

// Raw offset in car-local space: behind and above
const LOCAL_OFFSET = new THREE.Vector3(0, CAR.CAM_OFFSET_UP, CAR.CAM_OFFSET_BACK)

export function updateCameraRig(camera, chassisBody, dt, isBoosting) {
  if (!chassisBody || !camera) return
  const t = chassisBody.translation()
  const r = chassisBody.rotation()

  _chassisQuat.set(r.x, r.y, r.z, r.w)

  // Car centre in world space
  _lookAt.set(t.x, t.y + 0.6, t.z)

  // Target position: local offset rotated into world space
  _offset.copy(LOCAL_OFFSET)
  _offset.applyQuaternion(_chassisQuat)
  _targetPos.set(t.x + _offset.x, t.y + _offset.y, t.z + _offset.z)

  // Clamp camera from going underground
  if (_targetPos.y < 1.2) _targetPos.y = 1.2

  // Spring lerp toward target
  const spring = CAR.CAM_SPRING * dt
  const k = 1 - Math.exp(-spring * 8)
  camera.position.lerp(_targetPos, k)

  // Always look at the car centre
  camera.lookAt(_lookAt)

  // FOV transition
  const fovTarget = isBoosting ? CAR.CAM_FOV_BOOST : CAR.CAM_FOV_BASE
  camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-dt * 6))
  camera.updateProjectionMatrix()
}

// Teleport the camera instantly to the correct chase position (call on spawn)
export function snapCamera(camera, chassisBody) {
  if (!chassisBody || !camera) return
  const t = chassisBody.translation()
  const r = chassisBody.rotation()
  _chassisQuat.set(r.x, r.y, r.z, r.w)
  _offset.copy(LOCAL_OFFSET)
  _offset.applyQuaternion(_chassisQuat)
  camera.position.set(t.x + _offset.x, t.y + _offset.y, t.z + _offset.z)
  camera.lookAt(t.x, t.y + 0.6, t.z)
  camera.fov = CAR.CAM_FOV_BASE
  camera.updateProjectionMatrix()
}
