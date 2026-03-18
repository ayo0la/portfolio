/**
 * KnockableObjects — dynamic Rapier rigid bodies with Three.js mesh twins.
 *
 * Objects:
 *  - 1 football (centre circle)
 *  - 4 corner flags (thin cylinders)
 *  - 8 pitch-side adboards (standing panels)
 *  - 2 dugout benches
 *  - 4 sponsor crates (corners of pitch)
 *  - 2 media tripods (half-way line)
 *  - 6 water bottles (near benches)
 *  - 6 cone markers (scattered)
 */
import * as THREE from 'three'

let objects = []    // { mesh, body, initPos, initRot }

// ── Helpers ──────────────────────────────────────────────────────

function dynBody(RAPIER, world, x, y, z, mass, linDamp, angDamp) {
  const desc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, y, z)
    .setAdditionalMass(mass)
    .setLinearDamping(linDamp ?? 0.6)
    .setAngularDamping(angDamp ?? 0.8)
  return world.createRigidBody(desc)
}

function addObject(body, mesh, scene) {
  scene.add(mesh)
  objects.push({
    mesh,
    body,
    initPos: { x: body.translation().x, y: body.translation().y, z: body.translation().z },
    initRot: { x: 0, y: 0, z: 0, w: 1 },
  })
}

// ── Build all knockable objects ───────────────────────────────────

export function initKnockables(RAPIER, world, scene) {
  objects = []
  _addFootball(RAPIER, world, scene)
  _addCornerFlags(RAPIER, world, scene)
  _addAdboards(RAPIER, world, scene)
  _addDugoutBenches(RAPIER, world, scene)
  _addSponsorCrates(RAPIER, world, scene)
  _addTripods(RAPIER, world, scene)
  _addWaterBottles(RAPIER, world, scene)
  _addCones(RAPIER, world, scene)
  return objects
}

// ── Per-frame sync ────────────────────────────────────────────────

export function syncKnockables() {
  for (const o of objects) {
    const p = o.body.translation()
    const r = o.body.rotation()
    o.mesh.position.set(p.x, p.y, p.z)
    o.mesh.quaternion.set(r.x, r.y, r.z, r.w)
  }
}

// ── Reset ─────────────────────────────────────────────────────────

export function resetKnockables() {
  for (const o of objects) {
    o.body.setTranslation(o.initPos, true)
    o.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    o.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    o.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }
}

// ── Individual builders ───────────────────────────────────────────

function _addFootball(RAPIER, world, scene) {
  const R = 0.22
  const body = dynBody(RAPIER, world, 0, R + 0.1, 0, 0.45, 0.2, 0.3)
  world.createCollider(
    RAPIER.ColliderDesc.ball(R).setRestitution(0.78).setFriction(0.4),
    body
  )

  // Pentagons from sphere geo + seam lines
  const geo = new THREE.SphereGeometry(R, 16, 16)
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  const mesh = new THREE.Mesh(geo, mat)

  // Black hexagon patches as a child ring geometry
  const patchGeo = new THREE.SphereGeometry(R * 1.001, 8, 8)
  const patchMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, opacity: 0.15, transparent: true })
  const patches = new THREE.Mesh(patchGeo, patchMat)
  mesh.add(patches)

  addObject(body, mesh, scene)
}

function _addCornerFlags(RAPIER, world, scene) {
  const CORNERS = [[-52.5, -34], [-52.5, 34], [52.5, -34], [52.5, 34]]
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })

  CORNERS.forEach(([cx, cz]) => {
    const H = 1.5
    const body = dynBody(RAPIER, world, cx, H / 2, cz, 0.6, 1.2, 0.6)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.04, H / 2, 0.04).setRestitution(0.2),
      body
    )

    const group = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, H, 6), poleMat)
    group.add(pole)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), flagMat)
    flag.position.set(0.17, H / 2 - 0.12, 0)
    group.add(flag)

    addObject(body, group, scene)
  })
}

function _addAdboards(RAPIER, world, scene) {
  // 4 along each long side at z ≈ ±35, evenly spaced on x
  const POSITIONS = [
    [-30, 35], [-10, 35], [10, 35], [30, 35],
    [-30, -35], [-10, -35], [10, -35], [30, -35],
  ]
  const BW = 4.8, BH = 0.9, BD = 0.14
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x001122 })
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })

  POSITIONS.forEach(([ax, az]) => {
    const body = dynBody(RAPIER, world, ax, BH / 2, az, 10, 1.0, 1.5)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(BW / 2, BH / 2, BD / 2).setRestitution(0.15),
      body
    )
    const group = new THREE.Group()
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), bgMat)
    group.add(back)
    // Gold accent stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.8, 0.1, BD + 0.01), goldMat)
    stripe.position.y = BH / 2 - 0.08
    group.add(stripe)
    addObject(body, group, scene)
  })
}

function _addDugoutBenches(RAPIER, world, scene) {
  [[-35, 3], [35, 3]].forEach(([bx, bz]) => {
    const body = dynBody(RAPIER, world, bx, 0.35, bz, 22, 1.5, 2.0)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(3.0, 0.18, 0.55).setRestitution(0.1),
      body
    )
    const mat = new THREE.MeshLambertMaterial({ color: 0x2a3545 })
    const bench = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.36, 1.1), mat)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a2535 })
    ;[-2, 0, 2].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 1.0), legMat)
      leg.position.set(lx, -0.42, 0)
      bench.add(leg)
    })
    addObject(body, bench, scene)
  })
}

function _addSponsorCrates(RAPIER, world, scene) {
  const CRATE_POSITIONS = [[-28, 30], [28, 30], [-28, -30], [28, -30]]
  const crateMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a })
  const logoMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })

  CRATE_POSITIONS.forEach(([cx, cz]) => {
    const body = dynBody(RAPIER, world, cx, 0.5, cz, 7, 0.8, 1.2)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.25),
      body
    )
    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), crateMat)
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), logoMat)
    logo.position.set(0, 0, 0.505)
    crate.add(logo)
    addObject(body, crate, scene)
  })
}

function _addTripods(RAPIER, world, scene) {
  [[-34, 0], [34, 0]].forEach(([tx, tz]) => {
    const body = dynBody(RAPIER, world, tx, 0.9, tz, 4, 0.6, 0.8)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.12, 0.85, 0.12).setRestitution(0.1),
      body
    )
    const mat = new THREE.MeshLambertMaterial({ color: 0x3a4a5a })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), mat)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.35), mat)
    head.position.y = 0.85
    pole.add(head)
    addObject(body, pole, scene)
  })
}

function _addWaterBottles(RAPIER, world, scene) {
  const positions = [[-32, 4], [-33, 4.6], [-34.5, 3.5], [32, 4], [33, 4.6], [34.5, 3.5]]
  const botMat = new THREE.MeshLambertMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 })

  positions.forEach(([wx, wz]) => {
    const body = dynBody(RAPIER, world, wx, 0.22, wz, 0.3, 0.8, 0.5)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.05, 0.2, 0.05).setRestitution(0.35),
      body
    )
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.38, 8), botMat)
    addObject(body, bottle, scene)
  })
}

function _addCones(RAPIER, world, scene) {
  const CONE_POS = [
    [0,26],[6,24],[-6,24],[12,20],[-12,20],[0,16],
  ]
  const coneMat = new THREE.MeshLambertMaterial({ color: 0xff6a00 })

  CONE_POS.forEach(([cx, cz]) => {
    const body = dynBody(RAPIER, world, cx, 0.12, cz, 0.3, 1.0, 0.6)
    world.createCollider(
      RAPIER.ColliderDesc.ball(0.12).setRestitution(0.3),
      body
    )
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 8), coneMat)
    addObject(body, cone, scene)
  })
}
