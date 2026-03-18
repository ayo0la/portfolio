import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'

// Key football cities with [normalised x (0-1), normalised y (0-1)] on a simple Mercator
const CITIES = [
  { name: 'London',    x: 0.48, y: 0.28, active: true  },
  { name: 'Manchester',x: 0.47, y: 0.25, active: true  },
  { name: 'Madrid',    x: 0.45, y: 0.33, active: true  },
  { name: 'Barcelona', x: 0.46, y: 0.32, active: true  },
  { name: 'Paris',     x: 0.47, y: 0.30, active: true  },
  { name: 'Milan',     x: 0.50, y: 0.31, active: false },
  { name: 'Lagos',     x: 0.48, y: 0.52, active: false },
  { name: 'New York',  x: 0.25, y: 0.31, active: false },
  { name: 'Dubai',     x: 0.60, y: 0.40, active: false },
  { name: 'Tokyo',     x: 0.82, y: 0.32, active: false },
  { name: 'São Paulo', x: 0.32, y: 0.65, active: false },
]

export class ExpansionWing {
  constructor() {
    this.group = new THREE.Group()
    this.dots = []
    this.mapTex = null
  }

  build(scene) {
    this.group.position.set(0, 0, -52)

    const wallMat  = new THREE.MeshLambertMaterial({ color: 0x080e1c })
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x060a16 })

    // Room floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.15, 20), floorMat)
    floor.position.y = -0.07
    this.group.add(floor)

    // Walls
    ;[
      { sz: [28, 9, 0.2], pos: [0, 4.5, -10] },
      { sz: [28, 9, 0.2], pos: [0, 4.5,  10] },
      { sz: [0.2, 9, 20], pos: [-14, 4.5, 0] },
      { sz: [0.2, 9, 20], pos: [ 14, 4.5, 0] },
    ].forEach(({ sz, pos }) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(...sz), wallMat)
      w.position.set(...pos); this.group.add(w)
    })

    // Ceiling with subtle emissive grid lines
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(28, 0.2, 20), wallMat)
    ceil.position.y = 9; this.group.add(ceil)
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x002266, transparent: true, opacity: 0.35 })
    for (let gx = -13; gx <= 13; gx += 2) {
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 20), gridMat)
      gl.position.set(gx, 8.91, 0); this.group.add(gl)
    }
    for (let gz = -9; gz <= 9; gz += 2) {
      const gl = new THREE.Mesh(new THREE.BoxGeometry(28, 0.01, 0.05), gridMat)
      gl.position.set(0, 8.91, gz); this.group.add(gl)
    }

    // Phase roadmap panels on side walls
    const PHASES = [
      { title: 'PHASE 1 — NOW',    sub: 'UK market · Verified listings · Auth layer', color: '#ffd700' },
      { title: 'PHASE 2 — 2025',   sub: 'EU expansion · Cross-border corridors',      color: '#00e5ff' },
      { title: 'PHASE 3 — 2026',   sub: 'Global API · Open infrastructure layer',     color: '#00c853' },
      { title: 'PHASE 4 — BEYOND', sub: "Football's permanent trading fabric",         color: '#aa44ff' },
    ]
    PHASES.forEach((p, i) => {
      const side = i % 2 === 0 ? -1 : 1
      const zPos = -4 + Math.floor(i / 2) * 5
      const cv   = document.createElement('canvas')
      cv.width = 600; cv.height = 200
      const ctx = cv.getContext('2d')
      ctx.fillStyle = 'rgba(0,8,24,0.92)'; ctx.fillRect(0, 0, 600, 200)
      ctx.fillStyle = p.color; ctx.fillRect(0, 0, 6, 200)
      ctx.font = 'bold 28px Orbitron, Arial'; ctx.textBaseline = 'top'
      ctx.fillText(p.title, 20, 20)
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '20px Inter, Arial'
      ctx.fillText(p.sub, 20, 72)
      ctx.strokeStyle = p.color; ctx.globalAlpha = 0.15; ctx.lineWidth = 2
      ctx.strokeRect(1, 1, 598, 198); ctx.globalAlpha = 1
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 1.5),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, side: THREE.DoubleSide })
      )
      panel.position.set(side * 13.7, 3.2, zPos)
      panel.rotation.y = side * Math.PI / 2
      this.group.add(panel)
    })

    // Ambient
    const light = new THREE.PointLight(0x001a55, 3.0, 35)
    light.position.set(0, 8, 0)
    this.group.add(light)

    // World map floor projection
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = 1024; mapCanvas.height = 512
    const mc = mapCanvas.getContext('2d')
    this._drawWorldMap(mc, 1024, 512)
    this.mapTex = new THREE.CanvasTexture(mapCanvas)
    this.mapCanvas = mapCanvas
    this.mapCtx = mc

    const mapMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 11),
      new THREE.MeshBasicMaterial({ map: this.mapTex, transparent: true, depthWrite: false })
    )
    mapMesh.rotation.x = -Math.PI / 2
    mapMesh.position.set(0, 0.06, 0)
    this.group.add(mapMesh)

    // Title wall panel
    const titleTex = makeCanvasTexture(900, 120, (ctx, cw, ch) => {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 40px Orbitron, Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('FUTURE EXPANSION WING', cw / 2, 45)
      ctx.fillStyle = 'rgba(0,229,255,0.7)'
      ctx.font = '22px Inter, Arial'
      ctx.fillText('Phase 2 targets  ·  Building global infrastructure', cw / 2, 88)
    })
    const titlePanel = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 1.6),
      new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, side: THREE.DoubleSide })
    )
    titlePanel.position.set(0, 5, -9)
    this.group.add(titlePanel)

    // Floating city dots (3D spheres above map)
    CITIES.forEach(city => {
      const mapW = 22, mapD = 11
      const cx = (city.x - 0.5) * mapW
      const cz = (city.y - 0.5) * mapD

      const dotGeo = new THREE.SphereGeometry(city.active ? 0.22 : 0.14, 8, 8)
      const dotMat = new THREE.MeshBasicMaterial({
        color: city.active ? 0x00e5ff : 0x334455,
        transparent: true,
        opacity: city.active ? 0.9 : 0.5,
      })
      const dot = new THREE.Mesh(dotGeo, dotMat)
      dot.position.set(cx, 0.25, cz)
      dot.userData.active = city.active
      dot.userData.baseY = 0.25
      dot.userData.phase = Math.random() * Math.PI * 2
      this.group.add(dot)
      this.dots.push(dot)

      // Ping ring for active cities
      if (city.active) {
        const ringGeo = new THREE.RingGeometry(0.3, 0.4, 24)
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00e5ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = -Math.PI / 2
        ring.position.set(cx, 0.1, cz)
        ring.userData.phase = Math.random() * Math.PI * 2
        ring.userData.isRing = true
        this.group.add(ring)
        this.dots.push(ring)
      }
    })

    // Route arcs (active cities connected to London)
    const londonX = (0.48 - 0.5) * 22, londonZ = (0.28 - 0.5) * 11
    CITIES.filter(c => c.active && c.name !== 'London').forEach(city => {
      const cx = (city.x - 0.5) * 22
      const cz = (city.y - 0.5) * 11
      const arc = this._makeArc(londonX, londonZ, cx, cz)
      this.group.add(arc)
    })

    scene.add(this.group)
  }

  _drawWorldMap(ctx, w, h) {
    // Dark background
    ctx.fillStyle = 'rgba(0, 8, 22, 0.95)'
    ctx.fillRect(0, 0, w, h)

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 100, 200, 0.12)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= w; gx += w / 12) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
    }
    for (let gy = 0; gy <= h; gy += h / 6) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
    }

    // Rough continent blobs (simplified outlines using bezier paths)
    ctx.fillStyle = 'rgba(10, 35, 70, 0.75)'
    ctx.strokeStyle = 'rgba(0, 100, 180, 0.35)'
    ctx.lineWidth = 1.5

    // Europe / Asia / Africa (rough combined landmass)
    ctx.beginPath()
    ctx.moveTo(w * 0.42, h * 0.18)
    ctx.bezierCurveTo(w * 0.52, h * 0.12, w * 0.75, h * 0.10, w * 0.90, h * 0.20)
    ctx.bezierCurveTo(w * 0.98, h * 0.30, w * 0.95, h * 0.50, w * 0.88, h * 0.58)
    ctx.bezierCurveTo(w * 0.82, h * 0.70, w * 0.72, h * 0.75, w * 0.60, h * 0.72)
    ctx.bezierCurveTo(w * 0.52, h * 0.68, w * 0.50, h * 0.75, w * 0.46, h * 0.80)
    ctx.bezierCurveTo(w * 0.42, h * 0.75, w * 0.40, h * 0.65, w * 0.42, h * 0.55)
    ctx.bezierCurveTo(w * 0.44, h * 0.48, w * 0.40, h * 0.42, w * 0.42, h * 0.35)
    ctx.bezierCurveTo(w * 0.42, h * 0.28, w * 0.38, h * 0.25, w * 0.42, h * 0.18)
    ctx.closePath()
    ctx.fill(); ctx.stroke()

    // Americas
    ctx.beginPath()
    ctx.moveTo(w * 0.15, h * 0.18)
    ctx.bezierCurveTo(w * 0.22, h * 0.12, w * 0.30, h * 0.15, w * 0.32, h * 0.28)
    ctx.bezierCurveTo(w * 0.34, h * 0.40, w * 0.30, h * 0.48, w * 0.28, h * 0.55)
    ctx.bezierCurveTo(w * 0.26, h * 0.62, w * 0.30, h * 0.70, w * 0.28, h * 0.80)
    ctx.bezierCurveTo(w * 0.26, h * 0.88, w * 0.18, h * 0.90, w * 0.15, h * 0.82)
    ctx.bezierCurveTo(w * 0.10, h * 0.72, w * 0.08, h * 0.55, w * 0.10, h * 0.42)
    ctx.bezierCurveTo(w * 0.10, h * 0.30, w * 0.12, h * 0.22, w * 0.15, h * 0.18)
    ctx.closePath()
    ctx.fill(); ctx.stroke()

    // Australia
    ctx.beginPath()
    ctx.moveTo(w * 0.76, h * 0.58)
    ctx.bezierCurveTo(w * 0.84, h * 0.55, w * 0.90, h * 0.60, w * 0.90, h * 0.70)
    ctx.bezierCurveTo(w * 0.90, h * 0.78, w * 0.84, h * 0.82, w * 0.76, h * 0.80)
    ctx.bezierCurveTo(w * 0.70, h * 0.80, w * 0.68, h * 0.74, w * 0.70, h * 0.68)
    ctx.bezierCurveTo(w * 0.72, h * 0.62, w * 0.72, h * 0.59, w * 0.76, h * 0.58)
    ctx.closePath()
    ctx.fill(); ctx.stroke()

    // City dots
    CITIES.forEach(city => {
      const cx = city.x * w
      const cy = city.y * h
      ctx.beginPath()
      ctx.arc(cx, cy, city.active ? 5 : 3, 0, Math.PI * 2)
      ctx.fillStyle = city.active ? '#00e5ff' : 'rgba(100,150,200,0.5)'
      ctx.fill()

      if (city.active) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '12px Inter, Arial'
        ctx.fillText(city.name, cx + 7, cy - 3)
      }
    })
  }

  _makeArc(x1, z1, x2, z2) {
    const points = []
    const segs = 20
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      const x = x1 + (x2 - x1) * t
      const z = z1 + (z2 - z1) * t
      const arcH = Math.sin(t * Math.PI) * 1.5  // arc height
      points.push(new THREE.Vector3(x, arcH, z))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x00e5ff, transparent: true, opacity: 0.4
    }))
  }

  onEnter() { EventBus.emit('audio:zone', 'expansionWing') }
  onExit()  {}

  update(t) {
    this.dots.forEach((d, i) => {
      if (d.userData.isRing) {
        const scale = 1 + Math.sin(t * 1.5 + d.userData.phase) * 0.5
        d.scale.set(scale, scale, scale)
        d.material.opacity = 0.5 - Math.sin(t * 1.5 + d.userData.phase) * 0.25
      } else if (d.userData.active) {
        d.position.y = d.userData.baseY + Math.sin(t * 1.2 + d.userData.phase) * 0.06
      }
    })
    if (this.mapTex) this.mapTex.needsUpdate = false  // no need to re-draw each frame
  }
}
