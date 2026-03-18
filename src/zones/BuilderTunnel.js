import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'

const PANELS = [
  {
    title: 'SUPABASE BACKEND',
    icon: '⚡',
    lines: ['Postgres + Row-Level Security', 'Realtime subscriptions', 'Auth: email, magic-link, OAuth', 'Edge Functions for serverless logic'],
    color: '#3ECF8E',
  },
  {
    title: 'AI-ASSISTED DEV',
    icon: '🤖',
    lines: ['Claude API for content enrichment', 'Automated listing verification', 'LLM-powered trust scoring', 'Vibe-coding as a founder advantage'],
    color: '#00e5ff',
  },
  {
    title: 'MVP ARCHITECTURE',
    icon: '🏗',
    lines: ['Next.js frontend (App Router)', 'Supabase as BaaS layer', 'Stripe for payments', 'Cloudflare for CDN + edge'],
    color: '#ffd700',
  },
  {
    title: 'PRODUCT ROADMAP',
    icon: '🗺',
    lines: ['v1 — Verified listings marketplace', 'v2 — Collector profiles + trust scores', 'v3 — Cross-border shipping corridors', 'v4 — Open infrastructure API'],
    color: '#f44336',
  },
]

export class BuilderTunnel {
  constructor() {
    this.group = new THREE.Group()
    this.panels = []
  }

  build(scene) {
    this.group.position.set(-58, 0, 0)

    // Tunnel walls
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x080e1e })
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x0c1422 })

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 12), floorMat)
    floor.position.set(0, -0.1, 0)
    this.group.add(floor)

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 12), wallMat)
    ceil.position.set(0, 5.8, 0)
    this.group.add(ceil)

    // Side walls
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 0.3), wallMat)
    wallL.position.set(0, 3, 6)
    this.group.add(wallL)
    const wallR = wallL.clone()
    wallR.position.set(0, 3, -6)
    this.group.add(wallR)

    // Glow strip on ceiling
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x003366 })
    const glow = new THREE.Mesh(new THREE.BoxGeometry(14, 0.08, 0.3), glowMat)
    glow.position.set(0, 5.5, 0)
    this.group.add(glow)

    // Holographic panels — left and right walls
    PANELS.forEach((p, i) => {
      const side = i < 2 ? 1 : -1
      const xOff = i % 2 === 0 ? -3.5 : 3.5
      const panel = this._makePanel(p)
      panel.position.set(xOff, 2.8, side * 5.6)
      panel.rotation.y = side * -Math.PI / 2
      this.group.add(panel)
      this.panels.push(panel)
    })

    scene.add(this.group)
  }

  _makePanel(p) {
    const tex = makeCanvasTexture(512, 360, (ctx, cw, ch) => {
      // Holographic blue background
      ctx.fillStyle = 'rgba(0, 20, 50, 0.88)'
      ctx.fillRect(0, 0, cw, ch)

      // Top accent bar
      ctx.fillStyle = p.color
      ctx.fillRect(0, 0, cw, 4)

      // Icon + title
      ctx.font = '28px Arial'
      ctx.fillText(p.icon, 20, 46)
      ctx.fillStyle = p.color
      ctx.font = 'bold 28px Orbitron, Arial'
      ctx.fillText(p.title, 60, 48)

      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(16, 68); ctx.lineTo(cw - 16, 68)
      ctx.stroke()

      // Lines
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '20px Inter, Arial'
      p.lines.forEach((line, li) => {
        ctx.fillStyle = 'rgba(0,229,255,0.7)'
        ctx.fillText('›', 20, 104 + li * 56)
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fillText(line, 44, 104 + li * 56)
      })

      // Border glow
      ctx.strokeStyle = p.color
      ctx.globalAlpha = 0.2
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, cw - 2, ch - 2)
      ctx.globalAlpha = 1
    })

    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false
    })
    return new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.25), mat)
  }

  onEnter() { EventBus.emit('audio:zone', 'tunnel') }
  onExit()  {}

  update(t) {
    this.panels.forEach((p, i) => {
      p.material.opacity = 0.75 + Math.sin(t * 1.2 + i * 0.8) * 0.18
      p.position.y = 2.8 + Math.sin(t * 0.6 + i) * 0.05
    })
  }
}
