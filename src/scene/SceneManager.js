import * as THREE from 'three'

let scene, camera, renderer, clock

export function initScene() {
  // Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xb8d4e8, 0.0018)  // light daytime haze

  // Camera
  camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1800)
  camera.position.set(0, 1.7, 30)

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('app'),
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0  // sun handles brightness
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // Clock
  clock = new THREE.Clock()

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  return { scene, camera, renderer, clock }
}

export { scene, camera, renderer, clock }
