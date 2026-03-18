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
  _addFootballs(RAPIER, world, scene)
  _addCones(RAPIER, world, scene)
  _addBoxes(RAPIER, world, scene)
  _addBoots(RAPIER, world, scene)
  _addTrophy(RAPIER, world, scene)
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

function _addFootballs(RAPIER, world, scene) {
  const SPAWNS = [
    [0,0],[8,-6],[-8,-6],[15,8],[-15,8],[20,-15],[-20,-15],
    [5,20],[-5,20],[12,-22],[-12,-22],[0,-28],
  ]
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  const patchMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, opacity: 0.15, transparent: true })

  SPAWNS.forEach(([x, z]) => {
    const R = 0.22
    const body = dynBody(RAPIER, world, x, R + 0.1, z, 0.45, 0.2, 0.3)
    world.createCollider(RAPIER.ColliderDesc.ball(R).setRestitution(0.78).setFriction(0.4), body)
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 16), mat)
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.001, 8, 8), patchMat))
    addObject(body, mesh, scene)
  })
}

function _addCones(RAPIER, world, scene) {
  const SPAWNS = [[-18,12],[-16,14],[10,18],[12,20],[-25,-8],[-23,-6]]
  const mat = new THREE.MeshLambertMaterial({ color: 0xff6a00 })

  SPAWNS.forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.14, z, 0.3, 1.0, 0.6)
    world.createCollider(RAPIER.ColliderDesc.ball(0.13).setRestitution(0.3), body)
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 8), mat)
    addObject(body, mesh, scene)
  })
}

function _addBoxes(RAPIER, world, scene) {
  const SPAWNS = [[-40,25],[40,25],[-40,-25],[40,-25]]
  const mat = new THREE.MeshLambertMaterial({ color: 0xc8a060 })

  SPAWNS.forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.5, z, 8, 0.8, 1.2)
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.2), body)
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), mat)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
      new THREE.LineBasicMaterial({ color: 0x8a6030 })
    )
    mesh.add(edges)
    addObject(body, mesh, scene)
  })
}

function _addBoots(RAPIER, world, scene) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffd700 })
  const soleMat = new THREE.MeshLambertMaterial({ color: 0x222222 })

  [[-6, 0], [6, 0]].forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.2, z, 1.2, 0.7, 0.9)
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.15, 0.4).setRestitution(0.25), body)

    const group = new THREE.Group()
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.75), mat)
    upper.position.y = 0.1
    group.add(upper)
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.06, 0.80), soleMat)
    sole.position.y = -0.04
    group.add(sole)
    addObject(body, group, scene)
  })
}

function _addTrophy(RAPIER, world, scene) {
  const goldMat  = new THREE.MeshLambertMaterial({ color: 0xffd700 })
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x9a7000 })

  const body = dynBody(RAPIER, world, 0, 0.4, 0, 3, 1.2, 1.5)
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.4, 0.12).setRestitution(0.15), body)

  const group = new THREE.Group()
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.14, 8), darkMat)
  base.position.y = -0.3
  group.add(base)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.10, 0.55, 8), goldMat)
  stem.position.y = 0
  group.add(stem)
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.07, 0.42, 12, 1, true), goldMat)
  cup.position.y = 0.42
  group.add(cup)
  ;[-1, 1].forEach(side => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.025, 6, 8, Math.PI), goldMat)
    handle.rotation.z = side * Math.PI / 2
    handle.position.set(side * 0.22, 0.45, 0)
    group.add(handle)
  })

  addObject(body, group, scene)
}
