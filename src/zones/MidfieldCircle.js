import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'

const METRICS = [
  { title: 'GLOBAL REACH', value: 'Borderless', sub: 'Football commerce with no borders. Every boot, every kit, every era.' },
  { title: 'VERIFIED TRUST', value: 'Auth-First', sub: 'Provenance and authenticity as the foundation — not an afterthought.' },
  { title: 'AUTH FLOW', value: 'End-to-End', sub: 'Every item traced, verified, and certified before it changes hands.' },
  { title: 'COMMERCE LAYER', value: 'Infrastructure', sub: 'Building the rails for football\'s secondary market to run on.' },
]

export class MidfieldCircle {
  constructor() {
    this.group = new THREE.Group()
    this.orbitGroup = new THREE.Group()
    this.panelGroup = new THREE.Group()
  }

  build(scene) {
    // Pulsing outer glow ring
    const ringGeo = new THREE.RingGeometry(13.5, 15.5, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false
    })
    this.ring = new THREE.Mesh(ringGeo, ringMat)
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = 0.05
    this.group.add(this.ring)

    // Inner ring
    const innerRingGeo = new THREE.RingGeometry(9, 9.3, 64)
    const innerRing = new THREE.Mesh(innerRingGeo, new THREE.MeshBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false
    }))
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = 0.06
    this.group.add(innerRing)

    // Central orb — MDFLD platform sphere
    const orbGeo = new THREE.SphereGeometry(1.8, 24, 16)
    const orbCanvas = document.createElement('canvas')
    orbCanvas.width = orbCanvas.height = 256
    const oc = orbCanvas.getContext('2d')
    const og = oc.createRadialGradient(128, 128, 10, 128, 128, 120)
    og.addColorStop(0, '#003366')
    og.addColorStop(0.6, '#001133')
    og.addColorStop(1, '#000814')
    oc.fillStyle = og
    oc.fillRect(0, 0, 256, 256)
    oc.fillStyle = '#ffd700'
    oc.font = 'bold 52px Orbitron, Arial'
    oc.textAlign = 'center'
    oc.textBaseline = 'middle'
    oc.fillText('M', 128, 128)
    const orbMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(orbCanvas) })
    this.orb = new THREE.Mesh(orbGeo, orbMat)
    this.orb.position.y = 3
    this.group.add(this.orb)

    // Orbit ring (decorative)
    const orbitRingGeo = new THREE.TorusGeometry(4, 0.04, 8, 64)
    const orbitRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.3 })
    this.orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat)
    this.orbitRing.position.y = 3
    this.orbitRing.rotation.x = Math.PI / 4
    this.group.add(this.orbitRing)

    // Floating items in orbit (boots/kits/memorabilia)
    this.orbitGroup.position.y = 3
    this.group.add(this.orbitGroup)
    this._buildOrbitItems()

    // Metrics panels
    this.panelGroup.position.y = 0
    this.group.add(this.panelGroup)
    this._buildMetricsPanels()

    scene.add(this.group)
  }

  _buildOrbitItems() {
    const colors = [0xff4400, 0x0055aa, 0xffd700, 0x00aa44, 0xaa0033, 0x6600cc]

    // Boots (stylised box shapes)
    for (let i = 0; i < 4; i++) {
      const boot = new THREE.Group()
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.7), new THREE.MeshLambertMaterial({ color: colors[i] }))
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.55), new THREE.MeshLambertMaterial({ color: colors[i] }))
      upper.position.set(0, 0.18, -0.05)
      boot.add(sole, upper)
      this.orbitGroup.add(boot)
      boot.userData.orbitAngle = (i / 4) * Math.PI * 2
      boot.userData.orbitRadius = 4.5
      boot.userData.orbitSpeed = 0.4
      boot.userData.type = 'boot'
    }

    // Kits (flat coloured planes)
    for (let i = 0; i < 3; i++) {
      const kit = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.72),
        new THREE.MeshBasicMaterial({ color: colors[i + 3], transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      )
      kit.userData.orbitAngle = (i / 3) * Math.PI * 2 + 0.5
      kit.userData.orbitRadius = 6
      kit.userData.orbitSpeed = 0.28
      kit.userData.type = 'kit'
      this.orbitGroup.add(kit)
    }

    // Trophy torus
    for (let i = 0; i < 2; i++) {
      const trophy = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.07, 6, 20),
        new THREE.MeshLambertMaterial({ color: 0xffd700 })
      )
      trophy.userData.orbitAngle = i * Math.PI + 0.3
      trophy.userData.orbitRadius = 5.5
      trophy.userData.orbitSpeed = 0.22
      trophy.userData.type = 'trophy'
      this.orbitGroup.add(trophy)
    }
  }

  _buildMetricsPanels() {
    const panelW = 4.5, panelH = 2.8

    METRICS.forEach((m, i) => {
      const angle = (i / METRICS.length) * Math.PI * 2
      const radius = 10

      const tex = makeCanvasTexture(512, 320, (ctx, cw, ch) => {
        ctx.fillStyle = 'rgba(0,10,30,0.9)'
        ctx.fillRect(0, 0, cw, ch)
        ctx.fillStyle = '#ffd700'
        ctx.fillRect(0, 0, 4, ch)
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 30px Orbitron, Arial'
        ctx.textBaseline = 'top'
        ctx.fillText(m.title, 20, 18)
        ctx.fillStyle = '#00e5ff'
        ctx.font = 'bold 44px Orbitron, Arial'
        ctx.fillText(m.value, 20, 70)
        ctx.fillStyle = 'rgba(255,255,255,0.65)'
        ctx.font = '18px Inter, Arial'
        _wrapText(ctx, m.sub, 20, 135, cw - 32, 24)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, cw - 2, ch - 2)
      })

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(panelW, panelH),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      )

      panel.position.set(
        Math.sin(angle) * radius,
        3.5,
        Math.cos(angle) * radius
      )
      panel.rotation.y = -angle
      this.panelGroup.add(panel)
    })
  }

  onEnter() { EventBus.emit('audio:zone', 'midfield') }
  onExit()  {}

  update(t) {
    if (!this.ring) return

    // Pulse ring
    this.ring.material.opacity = 0.15 + Math.sin(t * 1.8) * 0.12

    // Rotate orb
    if (this.orb) this.orb.rotation.y = t * 0.4

    // Orbit items
    this.orbitGroup.children.forEach(item => {
      const a = item.userData.orbitAngle + t * item.userData.orbitSpeed
      const r = item.userData.orbitRadius
      item.position.set(Math.sin(a) * r, Math.sin(t * 0.6 + a) * 0.3, Math.cos(a) * r)
      item.rotation.y = a + Math.PI / 2
      if (item.userData.type === 'trophy') item.rotation.x = t * 0.6
    })

    // Slowly rotate orbit ring
    if (this.orbitRing) this.orbitRing.rotation.z = t * 0.18

    // Slowly rotate panel group
    this.panelGroup.rotation.y = t * 0.06
  }
}

function _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, y)
      line = words[i] + ' '
      y += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, y)
}
