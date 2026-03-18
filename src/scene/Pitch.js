import * as THREE from 'three'
import { STADIUM, COLORS } from '../utils/Constants.js'
import { makePitchLine } from '../utils/GeometryUtils.js'

export function buildPitch(scene) {
  const W = STADIUM.PITCH_W  // 105
  const D = STADIUM.PITCH_D  // 68

  // ── Grass surface ──────────────────────────────────────────
  const grassCanvas = document.createElement('canvas')
  grassCanvas.width = 512; grassCanvas.height = 512
  const gCtx = grassCanvas.getContext('2d')
  const stripes = 14
  const stripeW = 512 / stripes
  for (let i = 0; i < stripes; i++) {
    gCtx.fillStyle = i % 2 === 0 ? '#1a3d1a' : '#1f4a1f'
    gCtx.fillRect(i * stripeW, 0, stripeW, 512)
  }
  const grassTex = new THREE.CanvasTexture(grassCanvas)
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
  grassTex.repeat.set(1, 1)

  const grassGeo = new THREE.PlaneGeometry(W, D)
  const grassMat = new THREE.MeshLambertMaterial({ map: grassTex })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.rotation.x = -Math.PI / 2
  grass.receiveShadow = true
  scene.add(grass)

  // Outer ground (outside pitch, inside running track)
  const groundGeo = new THREE.PlaneGeometry(W + 30, D + 30)
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x141c14 })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  ground.receiveShadow = true
  scene.add(ground)

  // Concourse/track floor
  const trackGeo = new THREE.PlaneGeometry(300, 300)
  const trackMat = new THREE.MeshLambertMaterial({ color: COLORS.CONCRETE })
  const track = new THREE.Mesh(trackGeo, trackMat)
  track.rotation.x = -Math.PI / 2
  track.position.y = -0.02
  scene.add(track)

  // ── Pitch markings ─────────────────────────────────────────
  const LW = 0.12  // line width

  // Build all lines as a group
  const markings = new THREE.Group()

  // Pitch outline
  addRect(markings, 0, 0, W, D, LW)

  // Halfway line
  markings.add(makePitchLine(0, 0, LW, D))

  // Centre circle (ring)
  const ccGeo = new THREE.RingGeometry(9.15, 9.15 + LW, 48)
  const ccMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  const cc = new THREE.Mesh(ccGeo, ccMat)
  cc.rotation.x = -Math.PI / 2
  cc.position.y = 0.01
  markings.add(cc)

  // Centre spot
  const csGeo = new THREE.CircleGeometry(0.3, 16)
  const cs = new THREE.Mesh(csGeo, ccMat.clone())
  cs.rotation.x = -Math.PI / 2
  cs.position.y = 0.01
  markings.add(cs)

  // Penalty areas (18-yard box)
  const paW = 40.32, paD = 16.5
  addRect(markings, -(W / 2) + paD / 2, 0, paD, paW, LW) // left
  addRect(markings,  (W / 2) - paD / 2, 0, paD, paW, LW) // right

  // 6-yard boxes
  const gbW = 18.32, gbD = 5.5
  addRect(markings, -(W / 2) + gbD / 2, 0, gbD, gbW, LW) // left
  addRect(markings,  (W / 2) - gbD / 2, 0, gbD, gbW, LW) // right

  // Penalty spots
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const spotGeo = new THREE.CircleGeometry(0.3, 12)
  const spot1 = new THREE.Mesh(spotGeo, spotMat)
  spot1.rotation.x = -Math.PI / 2; spot1.position.set(-(W / 2) + 11, 0.01, 0)
  const spot2 = new THREE.Mesh(spotGeo, spotMat.clone())
  spot2.rotation.x = -Math.PI / 2; spot2.position.set((W / 2) - 11, 0.01, 0)
  markings.add(spot1, spot2)

  scene.add(markings)

  // ── Goals ──────────────────────────────────────────────────
  buildGoal(scene, -(W / 2), 1)
  buildGoal(scene,  (W / 2), -1)

  // ── Corner flags ───────────────────────────────────────────
  const corners = [
    [-W/2, -D/2], [-W/2, D/2], [W/2, -D/2], [W/2, D/2]
  ]
  const flagPoleMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  corners.forEach(([cx, cz]) => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6),
      flagPoleMat
    )
    pole.position.set(cx, 0.75, cz)
    scene.add(pole)
  })

  // ── Running track ring ─────────────────────────────────────
  const trackRingGeo = new THREE.RingGeometry(W / 2 + 3, W / 2 + 11, 64)
  const trackRingMat = new THREE.MeshLambertMaterial({ color: 0x3a1a0a, side: THREE.DoubleSide })
  const trackRing = new THREE.Mesh(trackRingGeo, trackRingMat)
  trackRing.rotation.x = -Math.PI / 2
  trackRing.position.y = 0.005
  scene.add(trackRing)
}

// Helper: rectangle outline from 4 line meshes
function addRect(parent, cx, cz, w, d, lw) {
  parent.add(makePitchLine(cx,      cz - d/2 + lw/2, w, lw))  // top edge
  parent.add(makePitchLine(cx,      cz + d/2 - lw/2, w, lw))  // bottom edge
  parent.add(makePitchLine(cx - w/2 + lw/2, cz, lw, d))       // left edge
  parent.add(makePitchLine(cx + w/2 - lw/2, cz, lw, d))       // right edge
}

function buildGoal(scene, xPos, dir) {
  const GW = 7.32   // goalmouth width (between posts)
  const GH = 2.44   // crossbar height
  const BD = 2.4    // back depth
  const PR = 0.1    // post radius
  const BR = 0.08   // back/top frame radius

  const postMat  = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee })

  // ── Front face ──────────────────────────────────────────────
  // Left post
  const postGeo = new THREE.CylinderGeometry(PR, PR, GH, 12)
  const post1 = new THREE.Mesh(postGeo, postMat)
  post1.position.set(xPos, GH / 2, -GW / 2)

  // Right post
  const post2 = post1.clone()
  post2.position.set(xPos, GH / 2, GW / 2)

  // Crossbar — runs along Z (rotation.x = π/2 rotates Y-axis cylinder to Z-axis)
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(PR, PR, GW, 12), postMat)
  crossbar.rotation.x = Math.PI / 2
  crossbar.position.set(xPos, GH, 0)

  // ── Back frame ──────────────────────────────────────────────
  const bPostGeo = new THREE.CylinderGeometry(BR, BR, GH, 10)
  const backPost1 = new THREE.Mesh(bPostGeo, frameMat)
  backPost1.position.set(xPos + dir * BD, GH / 2, -GW / 2)

  const backPost2 = backPost1.clone()
  backPost2.position.set(xPos + dir * BD, GH / 2, GW / 2)

  // Back top bar (completes the rectangular frame at the top)
  const backTopBar = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR, GW, 10), frameMat)
  backTopBar.rotation.x = Math.PI / 2
  backTopBar.position.set(xPos + dir * BD, GH, 0)

  // ── Side top bars (connecting front crossbar to back top bar) ──
  // These run along the local X axis (in/out of goal), so rotation.z = π/2
  const sideBarGeo = new THREE.CylinderGeometry(BR, BR, BD, 10)
  const sideBar1 = new THREE.Mesh(sideBarGeo, frameMat)
  sideBar1.rotation.z = Math.PI / 2
  sideBar1.position.set(xPos + dir * BD / 2, GH, -GW / 2)

  const sideBar2 = sideBar1.clone()
  sideBar2.position.set(xPos + dir * BD / 2, GH, GW / 2)

  // ── Ground anchors ───────────────────────────────────────────
  const anchorGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.07, 10)
  const anchorMat = new THREE.MeshLambertMaterial({ color: 0xcccccc })
  const anchor1 = new THREE.Mesh(anchorGeo, anchorMat)
  anchor1.position.set(xPos, 0.035, -GW / 2)
  const anchor2 = anchor1.clone()
  anchor2.position.set(xPos, 0.035, GW / 2)

  // ── Net ──────────────────────────────────────────────────────
  // Clean grid — no duplicate segments
  const netPts = []
  const zSegs = 14, ySegs = 6, xSegs = 5
  const netMat = new THREE.LineBasicMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.28 })

  // Front face: vertical lines
  for (let c = 0; c <= zSegs; c++) {
    const z = -GW / 2 + (c / zSegs) * GW
    netPts.push(new THREE.Vector3(xPos, 0, z), new THREE.Vector3(xPos, GH, z))
  }
  // Front face: horizontal lines
  for (let r = 1; r <= ySegs; r++) {
    const y = (r / ySegs) * GH
    netPts.push(new THREE.Vector3(xPos, y, -GW / 2), new THREE.Vector3(xPos, y, GW / 2))
  }

  // Top panel: fore-aft lines
  for (let c = 0; c <= zSegs; c++) {
    const z = -GW / 2 + (c / zSegs) * GW
    netPts.push(new THREE.Vector3(xPos, GH, z), new THREE.Vector3(xPos + dir * BD, GH, z))
  }
  // Top panel: cross lines
  for (let s = 1; s < xSegs; s++) {
    const x = xPos + dir * (s / xSegs) * BD
    netPts.push(new THREE.Vector3(x, GH, -GW / 2), new THREE.Vector3(x, GH, GW / 2))
  }

  // Left side panel: vertical lines
  for (let s = 1; s < xSegs; s++) {
    const x = xPos + dir * (s / xSegs) * BD
    netPts.push(new THREE.Vector3(x, 0, -GW / 2), new THREE.Vector3(x, GH, -GW / 2))
  }
  // Left side panel: horizontal lines
  for (let r = 1; r <= ySegs; r++) {
    const y = (r / ySegs) * GH
    netPts.push(new THREE.Vector3(xPos, y, -GW / 2), new THREE.Vector3(xPos + dir * BD, y, -GW / 2))
  }

  // Right side panel: vertical lines
  for (let s = 1; s < xSegs; s++) {
    const x = xPos + dir * (s / xSegs) * BD
    netPts.push(new THREE.Vector3(x, 0, GW / 2), new THREE.Vector3(x, GH, GW / 2))
  }
  // Right side panel: horizontal lines
  for (let r = 1; r <= ySegs; r++) {
    const y = (r / ySegs) * GH
    netPts.push(new THREE.Vector3(xPos, y, GW / 2), new THREE.Vector3(xPos + dir * BD, y, GW / 2))
  }

  // Back panel: vertical lines
  for (let c = 0; c <= zSegs; c++) {
    const z = -GW / 2 + (c / zSegs) * GW
    netPts.push(new THREE.Vector3(xPos + dir * BD, 0, z), new THREE.Vector3(xPos + dir * BD, GH, z))
  }
  // Back panel: horizontal lines
  for (let r = 1; r <= ySegs; r++) {
    const y = (r / ySegs) * GH
    netPts.push(new THREE.Vector3(xPos + dir * BD, y, -GW / 2), new THREE.Vector3(xPos + dir * BD, y, GW / 2))
  }

  const netMesh = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(netPts),
    netMat
  )

  scene.add(post1, post2, crossbar, backPost1, backPost2, backTopBar, sideBar1, sideBar2, anchor1, anchor2, netMesh)
}
