import * as THREE from 'three'

export function buildSky(scene) {
  // ── Daytime gradient sky sphere ────────────────────────────
  const skyGeo = new THREE.SphereGeometry(1400, 20, 10)
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor:     { value: new THREE.Color(0x1565c0) },   // deep afternoon blue
      horizonColor: { value: new THREE.Color(0x87ceeb) },   // pale sky-blue horizon
      offset:       { value: 12 },
      exponent:     { value: 0.45 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos + offset).y;
        gl_FragColor = vec4(mix(horizonColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  })
  scene.add(new THREE.Mesh(skyGeo, skyMat))

  // ── Sun disc ───────────────────────────────────────────────
  // Position matches the directional sun light in Floodlights.js (80, 120, 60)
  const sunDir = new THREE.Vector3(80, 120, 60).normalize()
  const sunDist = 1200

  const sunGeo = new THREE.CircleGeometry(28, 32)
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfffbe8,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  })
  const sun = new THREE.Mesh(sunGeo, sunMat)
  sun.position.copy(sunDir.clone().multiplyScalar(sunDist))
  sun.lookAt(0, 0, 0)
  scene.add(sun)

  // Inner glow ring
  const innerGlowGeo = new THREE.CircleGeometry(50, 32)
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfff9d0,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })
  const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat)
  innerGlow.position.copy(sun.position)
  innerGlow.lookAt(0, 0, 0)
  scene.add(innerGlow)

  // Outer halo
  const haloGeo = new THREE.CircleGeometry(110, 32)
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xfff5b0,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
  })
  const halo = new THREE.Mesh(haloGeo, haloMat)
  halo.position.copy(sun.position)
  halo.lookAt(0, 0, 0)
  scene.add(halo)

  // ── Light clouds (stretched billboard planes) ──────────────
  const cloudMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const cloudPositions = [
    { x: -400, y: 320, z: -700, rx: 4, rz: 1 },
    { x:  600, y: 280, z: -600, rx: 6, rz: 1.2 },
    { x: -700, y: 350, z:  400, rx: 5, rz: 1 },
    { x:  200, y: 300, z:  650, rx: 7, rz: 1.1 },
    { x:  800, y: 260, z:  -50, rx: 5, rz: 0.9 },
  ]
  cloudPositions.forEach(({ x, y, z, rx, rz }) => {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(rx * 80, rz * 80), cloudMat.clone())
    cloud.position.set(x, y, z)
    cloud.lookAt(0, 0, 0)
    scene.add(cloud)
  })
}
