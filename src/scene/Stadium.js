import * as THREE from 'three'
import { COLORS } from '../utils/Constants.js'

export function buildStadium(scene) {
  // ── Bowl walls ─────────────────────────────────────────────
  const bowlMat     = new THREE.MeshLambertMaterial({ color: COLORS.STADIUM_WALL, side: THREE.DoubleSide })
  const concreteMat = new THREE.MeshLambertMaterial({ color: COLORS.CONCRETE })

  const outerGeo = new THREE.CylinderGeometry(115, 120, 30, 48, 1, true)
  const outer = new THREE.Mesh(outerGeo, bowlMat)
  outer.position.y = 14
  scene.add(outer)

  const innerGeo = new THREE.CylinderGeometry(72, 105, 28, 48, 1, true)
  const inner = new THREE.Mesh(innerGeo, concreteMat)
  inner.position.y = 13
  scene.add(inner)

  // Roof canopy ring
  const roofGeo = new THREE.CylinderGeometry(113, 72, 2.5, 48, 1, true)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x1a2438, side: THREE.DoubleSide })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = 29
  scene.add(roof)

  // Roof top slab
  const roofTop = new THREE.Mesh(
    new THREE.RingGeometry(72, 114, 48),
    new THREE.MeshLambertMaterial({ color: 0x141e2a })
  )
  roofTop.rotation.x = -Math.PI / 2
  roofTop.position.y = 30
  scene.add(roofTop)

  // ── Concourse floor ────────────────────────────────────────
  const concourse = new THREE.Mesh(
    new THREE.RingGeometry(68, 112, 48),
    new THREE.MeshLambertMaterial({ color: 0x3a4050 })
  )
  concourse.rotation.x = -Math.PI / 2
  concourse.position.y = -0.05
  scene.add(concourse)

  buildSeats(scene)
  buildCrowdSections(scene)
  buildBanners(scene)
  buildAdBoards(scene)
  buildTunnelArch(scene, -58, 0,   0, 0, 'BUILDER\nTUNNEL')
  buildTunnelArch(scene,  58, 0,  26, 0, 'LOCKER\nROOM')
  buildTunnelArch(scene, -58, 0, -26, 0, 'TRANSFER\nMARKET')
  buildScoreboard(scene)
}

// ── Seats ───────────────────────────────────────────────────────

function buildSeats(scene) {
  const rows = 18, colsPerRow = 90, totalSeats = rows * colsPerRow * 2

  const seatGeo     = new THREE.BoxGeometry(0.85, 0.5, 0.45)
  const seatMatBlue = new THREE.MeshLambertMaterial({ color: COLORS.SEAT_BLUE })
  const seatMatRed  = new THREE.MeshLambertMaterial({ color: COLORS.SEAT_ACCENT })
  const seatMatVip  = new THREE.MeshLambertMaterial({ color: COLORS.SEAT_VIP })

  const seatsBlue = new THREE.InstancedMesh(seatGeo, seatMatBlue, totalSeats)
  const seatsRed  = new THREE.InstancedMesh(seatGeo, seatMatRed,  Math.floor(totalSeats * 0.25))
  const seatsVip  = new THREE.InstancedMesh(seatGeo, seatMatVip,  Math.floor(totalSeats * 0.08))
  ;[seatsBlue, seatsRed, seatsVip].forEach(m => { m.castShadow = false; m.receiveShadow = false })

  const dummy = new THREE.Object3D()
  let iBlue = 0, iRed = 0, iVip = 0

  for (let side = 0; side < 2; side++) {
    const sideZ = side === 0 ? 1 : -1
    for (let row = 0; row < rows; row++) {
      const radius = 72 + row * 1.8, tiltAngle = 0.28 + row * 0.018
      for (let col = 0; col < colsPerRow; col++) {
        const theta = Math.PI * (col / colsPerRow) * sideZ
        dummy.position.set(
          Math.sin(theta) * radius,
          row * 0.85 + 0.3,
          Math.cos(theta) * radius * 0.55
        )
        dummy.rotation.set(-tiltAngle, theta, 0)
        dummy.updateMatrix()

        const isVip = row < 2 && col >= 35 && col <= 55
        const isRed = col < 14 || col > 76

        if (isVip && iVip < seatsVip.count) { seatsVip.setMatrixAt(iVip++, dummy.matrix) }
        else if (isRed && iRed < seatsRed.count) { seatsRed.setMatrixAt(iRed++, dummy.matrix) }
        else if (iBlue < seatsBlue.count) { seatsBlue.setMatrixAt(iBlue++, dummy.matrix) }
      }
    }
  }

  seatsBlue.count = iBlue; seatsRed.count = iRed; seatsVip.count = iVip
  ;[seatsBlue, seatsRed, seatsVip].forEach(m => { m.instanceMatrix.needsUpdate = true })
  scene.add(seatsBlue, seatsRed, seatsVip)
}

// ── Crowd silhouettes (upper-tier fan blocks) ───────────────────

function buildCrowdSections(scene) {
  const fanGeo    = new THREE.BoxGeometry(0.55, 1.1, 0.35)
  const fanColors = [0x1a3a8f, 0xc41e3a, 0xfafafa, 0xffd700, 0x004d00]
  const fanMats   = fanColors.map(c => new THREE.MeshLambertMaterial({ color: c }))
  const perColor  = 450
  const meshes    = fanMats.map(m => new THREE.InstancedMesh(fanGeo, m, perColor))
  const dummy     = new THREE.Object3D()
  const counts    = fanMats.map(() => 0)
  const rng       = mulberry32(77)

  for (let side = 0; side < 2; side++) {
    const sideZ = side === 0 ? 1 : -1
    for (let row = 13; row < 22; row++) {
      const radius = 72 + row * 1.8
      for (let col = 0; col < 90; col += 2) {
        const theta = Math.PI * (col / 90) * sideZ
        const ci = Math.floor(rng() * fanColors.length)
        if (counts[ci] >= perColor) continue
        dummy.position.set(
          Math.sin(theta) * radius,
          row * 0.85 + 1.1,
          Math.cos(theta) * radius * 0.55
        )
        dummy.rotation.set(-0.38, theta, 0)
        dummy.updateMatrix()
        meshes[ci].setMatrixAt(counts[ci]++, dummy.matrix)
      }
    }
  }

  meshes.forEach((m, i) => {
    m.count = counts[i]
    m.instanceMatrix.needsUpdate = true
    scene.add(m)
  })
}

// Deterministic PRNG — crowd is identical on every load
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Hanging banners from roof ring ──────────────────────────────

function buildBanners(scene) {
  const bannerData = [
    { text: 'MDFLD',        colorHex: '#ffd700', bgHex: '#001133' },
    { text: 'AYOOLA',       colorHex: '#ffffff', bgHex: '#1a0a60' },
    { text: 'THE MARKET',   colorHex: '#00e5ff', bgHex: '#001a22' },
    { text: 'FOOTBALL FWD', colorHex: '#ffd700', bgHex: '#001133' },
    { text: 'VERIFIED',     colorHex: '#00c853', bgHex: '#001a10' },
    { text: 'MDFLD',        colorHex: '#ffd700', bgHex: '#001133' },
    { text: 'EST 2024',     colorHex: '#ffffff', bgHex: '#1a0a60' },
    { text: 'BORDERLESS',   colorHex: '#00e5ff', bgHex: '#001a22' },
  ]
  const count = bannerData.length
  const BW = 3.8, BH = 9.5

  bannerData.forEach(({ text, colorHex, bgHex }, i) => {
    const angle = (i / count) * Math.PI * 2, r = 82
    const cv = document.createElement('canvas')
    cv.width = 256; cv.height = 640
    const ctx = cv.getContext('2d')

    ctx.fillStyle = bgHex
    ctx.fillRect(0, 0, 256, 640)
    ctx.fillStyle = colorHex
    ctx.fillRect(0, 0,   256, 22)
    ctx.fillRect(0, 618, 256, 22)

    ctx.font = 'bold 46px Orbitron, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.save()
    ctx.translate(128, 320)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(text, 0, 0)
    ctx.restore()

    const tex  = new THREE.CanvasTexture(cv)
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(BW, BH),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    )
    mesh.position.set(Math.sin(angle) * r, 22, Math.cos(angle) * r)
    mesh.rotation.y = -angle
    scene.add(mesh)

    // Metal rod at top of banner
    const rod = new THREE.Mesh(
      new THREE.BoxGeometry(BW + 0.5, 0.18, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x3a4a5a })
    )
    rod.position.set(Math.sin(angle) * r, 26.8, Math.cos(angle) * r)
    rod.rotation.y = -angle
    scene.add(rod)
  })
}

// ── Advertising boards ──────────────────────────────────────────

function buildAdBoards(scene) {
  const adMat   = new THREE.MeshBasicMaterial({ color: COLORS.ADBOARD_BG })
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x003366 })
  const W = 105, D = 68, boardH = 0.9, boardD = 0.15

  const boards = [
    { pos: [0,            boardH / 2,  D / 2 + 1],  rot: 0,            w: W },
    { pos: [0,            boardH / 2, -(D / 2 + 1)], rot: Math.PI,     w: W },
    { pos: [W / 2 + 1,    boardH / 2,  0],           rot: -Math.PI / 2, w: D },
    { pos: [-(W / 2 + 1), boardH / 2,  0],           rot:  Math.PI / 2, w: D },
  ]

  boards.forEach(({ pos, rot, w }) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, boardH, boardD), adMat)
    board.position.set(...pos)
    board.rotation.y = rot
    scene.add(board)

    const strips = Math.floor(w / 8)
    for (let i = 0; i < strips; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(3, boardH - 0.1, boardD + 0.01),
        i % 3 === 0 ? goldMat : cyanMat
      )
      s.position.set(pos[0], pos[1], pos[2])
      const offset = (i - strips / 2) * 8
      s.position.x += Math.cos(rot + Math.PI / 2) * offset
      s.position.z += Math.sin(rot + Math.PI / 2) * offset
      scene.add(s)
    }
  })
}

// ── Tunnel arches ───────────────────────────────────────────────

function buildTunnelArch(scene, x, y, z, rotY, label) {
  const mat     = new THREE.MeshLambertMaterial({ color: 0x1a2438 })
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x003366 })
  const group   = new THREE.Group()
  group.position.set(x, y, z)
  group.rotation.y = rotY

  const add = (geo, mat, px, py, pz) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(px, py, pz)
    group.add(m)
  }

  add(new THREE.BoxGeometry(1.2, 5, 2),    mat,     -2.5, 2.5, 0)
  add(new THREE.BoxGeometry(1.2, 5, 2),    mat,      2.5, 2.5, 0)
  add(new THREE.BoxGeometry(7,   1, 2),    mat,        0, 5.5, 0)
  add(new THREE.BoxGeometry(5, 0.1, 0.2), glowMat,    0, 5.0, 0.8)

  if (label) {
    const cv  = document.createElement('canvas')
    cv.width = 512; cv.height = 160
    const ctx = cv.getContext('2d')
    ctx.fillStyle = '#00102a'
    ctx.fillRect(0, 0, 512, 160)
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 3
    ctx.strokeRect(4, 4, 504, 152)
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 38px Orbitron, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    label.split('\n').forEach((line, li, arr) => {
      ctx.fillText(line, 256, 80 + (li - (arr.length - 1) / 2) * 48)
    })
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 1.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, side: THREE.DoubleSide })
    )
    sign.position.set(0, 7.4, 0)
    group.add(sign)
  }

  scene.add(group)
}

// ── Scoreboard ──────────────────────────────────────────────────

function buildScoreboard(scene) {
  const mat   = new THREE.MeshLambertMaterial({ color: 0x0c1420 })
  const frame = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 1), mat)
  frame.position.set(0, 20, -82)
  scene.add(frame)

  const cv = document.createElement('canvas')
  cv.width = 1024; cv.height = 384
  const ctx = cv.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 1024, 0)
  grad.addColorStop(0, '#000814'); grad.addColorStop(0.5, '#001533'); grad.addColorStop(1, '#000814')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1024, 384)
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 100px Orbitron, Arial'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('MDFLD', 512, 160)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '28px Inter, Arial'
  ctx.fillText('AYOOLA MORAKINYO — FOUNDER PORTFOLIO', 512, 280)

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 8.5),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })
  )
  screen.position.set(0, 20, -81.4)
  scene.add(screen)

  const pylonMat = new THREE.MeshLambertMaterial({ color: 0x141e2a })
  ;[-10, 10].forEach(px => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 18, 8), pylonMat)
    p.position.set(px, 9, -82)
    scene.add(p)
  })
}
