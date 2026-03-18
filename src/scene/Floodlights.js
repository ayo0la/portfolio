import * as THREE from 'three'
import { LIGHTS } from '../utils/Constants.js'

const floodlights = []
let ambientLight, sunLight

export function buildFloodlights(scene) {
  // ── Ambient fill ────────────────────────────────────────────
  ambientLight = new THREE.AmbientLight(LIGHTS.AMBIENT_COLOR, LIGHTS.AMBIENT_INTENSITY)
  scene.add(ambientLight)

  // ── Hemisphere — sky blue above, grass green below ─────────
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d7a3d, 2.2)
  scene.add(hemiLight)

  // ── Directional sun ─────────────────────────────────────────
  // Position matches the sun disc in Sky.js (80, 120, 60 normalised × distance)
  sunLight = new THREE.DirectionalLight(LIGHTS.SUN_COLOR, LIGHTS.SUN_INTENSITY)
  sunLight.position.set(80, 120, 60)
  sunLight.target.position.set(0, 0, 0)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width  = 2048
  sunLight.shadow.mapSize.height = 2048
  sunLight.shadow.camera.near    = 1
  sunLight.shadow.camera.far     = 400
  sunLight.shadow.camera.left    = -160
  sunLight.shadow.camera.right   =  160
  sunLight.shadow.camera.top     =  160
  sunLight.shadow.camera.bottom  = -160
  sunLight.shadow.bias           = -0.0005
  scene.add(sunLight)
  scene.add(sunLight.target)

  // ── 4 corner floodlight pylons (structural detail, dimmed in day) ─
  const corners = [
    { x:  80, z:  55 },
    { x: -80, z:  55 },
    { x:  80, z: -55 },
    { x: -80, z: -55 },
  ]

  corners.forEach(({ x, z }) => {
    const pylon = buildPylon(scene, x, z)
    floodlights.push(pylon.light)
  })

  return { floodlights, ambientLight, sunLight, hemiLight }
}

function buildPylon(scene, x, z) {
  const mat = new THREE.MeshLambertMaterial({ color: 0x2a3540 })

  // Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 44, 8), mat)
  mast.position.set(x, 22, z)
  scene.add(mast)

  // Cross arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 0.4), mat)
  arm.position.set(x, 44.5, z)
  scene.add(arm)

  // Light housing boxes
  const housingMat = new THREE.MeshLambertMaterial({ color: 0x3a4a5a })
  const glowMat    = new THREE.MeshBasicMaterial({ color: LIGHTS.FLOOD_COLOR })

  for (let i = -2; i <= 2; i++) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.9), housingMat)
    housing.position.set(x + i * 1.6, 45, z)
    scene.add(housing)

    const lens = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.25, 0.1), glowMat)
    lens.position.set(x + i * 1.6, 45, z + Math.sign(z) * -0.4)
    lens.lookAt(0, 0, 0)
    scene.add(lens)
  }

  // Spot aimed at pitch — dims relative to sun during day
  const light = new THREE.SpotLight(LIGHTS.FLOOD_COLOR, LIGHTS.DAY_FLOOD_INTENSITY)
  light.position.set(x, 45, z)
  light.target.position.set(0, 0, 0)
  light.angle     = Math.PI / 5.5
  light.penumbra  = 0.35
  light.decay     = 1.5
  light.distance  = 200
  light.castShadow = false  // sun handles shadows
  scene.add(light)
  scene.add(light.target)

  return { light }
}
