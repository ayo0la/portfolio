import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'
import { PROJECTS } from '../data/projects.js'

export class TheArchive {
  constructor() {
    this.group = new THREE.Group()
    this.cards = []
  }

  build(scene) {
    this.group.position.set(60, 0, 0)

    // Room — cool grey-blue palette, sketchbook energy
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x0b1018 })
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x0e1520 })

    const floor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 16), floorMat)
    floor.position.y = -0.07
    this.group.add(floor)

    // Ceiling with grid lines etched in
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 16), wallMat)
    ceiling.position.y = 7
    this.group.add(ceiling)

    // Side walls
    ;[6, -6].forEach(zPos => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 0.2), wallMat)
      wall.position.set(0, 3.5, zPos)
      this.group.add(wall)
    })

    // Soft ambient — cooler, quieter than main stadium
    const ambientPt = new THREE.PointLight(0x1a3050, 2.2, 25)
    ambientPt.position.set(0, 6, 0)
    this.group.add(ambientPt)

    // Entry title
    const titleTex = makeCanvasTexture(900, 100, (ctx, cw, ch) => {
      ctx.fillStyle = 'rgba(20, 36, 60, 0.0)'
      ctx.fillRect(0, 0, cw, ch)
      ctx.fillStyle = '#8ab4d4'
      ctx.font = 'bold 34px Orbitron, Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('THE ARCHIVE — OTHER BUILDS', cw / 2, 38)
      ctx.fillStyle = 'rgba(150,200,255,0.45)'
      ctx.font = '18px Inter, Arial'
      ctx.fillText('Projects built outside of MDFLD', cw / 2, 74)
    })
    const titlePanel = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 1.25),
      new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, side: THREE.DoubleSide })
    )
    titlePanel.position.set(0, 6, 0)
    this.group.add(titlePanel)

    // Project cards — arranged on two walls
    const perWall = Math.ceil(PROJECTS.length / 2)
    PROJECTS.forEach((proj, i) => {
      const wall = i < perWall ? 1 : -1  // +z or -z wall
      const col = i < perWall ? i : i - perWall
      const totalOnWall = i < perWall ? Math.min(perWall, PROJECTS.length) : PROJECTS.length - perWall
      const startX = -(totalOnWall - 1) * 2.4

      const card = this._makeProjectCard(proj)
      const xPos = startX + col * 4.8
      const yPos = 2.8
      const zPos = wall * 5.5

      card.position.set(xPos, yPos, zPos)
      card.rotation.y = wall === 1 ? Math.PI : 0
      card.userData.baseY = yPos
      card.userData.phase = i * 0.9
      this.group.add(card)
      this.cards.push(card)
    })

    scene.add(this.group)
  }

  _makeProjectCard(proj) {
    const statusColors = {
      'Live':        '#00c853',
      'In Progress': '#ffd700',
      'Archived':    '#607d8b',
      'Prototype':   '#ff6d00',
      'Open Source': '#00e5ff',
    }
    const sc = statusColors[proj.status] || '#8ab4d4'

    const tex = makeCanvasTexture(512, 320, (ctx, cw, ch) => {
      // Background — cooler, more muted than MDFLD zone
      ctx.fillStyle = 'rgba(8, 16, 30, 0.93)'
      ctx.fillRect(0, 0, cw, ch)

      // Top accent
      ctx.fillStyle = sc
      ctx.fillRect(0, 0, cw, 4)

      // Status pill
      ctx.fillStyle = sc
      ctx.font = 'bold 14px Orbitron, Arial'
      const sw = ctx.measureText(proj.status).width + 20
      ctx.beginPath()
      ctx.roundRect?.(cw - sw - 14, 14, sw, 22, 4) ||
        ctx.rect(cw - sw - 14, 14, sw, 22)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'middle'
      ctx.fillText(proj.status, cw - sw - 4, 25)

      // Title
      ctx.fillStyle = '#c8dff0'
      ctx.font = 'bold 26px Orbitron, Arial'
      ctx.textBaseline = 'top'
      ctx.fillText(proj.name, 16, 16)

      // Stack tags
      ctx.fillStyle = 'rgba(100,180,255,0.65)'
      ctx.font = '15px Inter, Arial'
      ctx.fillText(proj.stack, 16, 56)

      // Divider
      ctx.strokeStyle = 'rgba(100,150,200,0.1)'
      ctx.beginPath(); ctx.moveTo(16, 80); ctx.lineTo(cw - 16, 80); ctx.stroke()

      // Description
      ctx.fillStyle = 'rgba(200,220,255,0.72)'
      ctx.font = '17px Inter, Arial'
      _wrapText(ctx, proj.description, 16, 96, cw - 32, 26)

      // Link hint
      if (proj.link) {
        ctx.fillStyle = 'rgba(100,180,255,0.5)'
        ctx.font = '13px Inter, Arial'
        ctx.fillText('↗ ' + proj.link, 16, ch - 20)
      }

      // Border
      ctx.strokeStyle = 'rgba(100,150,200,0.08)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(1, 1, cw - 2, ch - 2)
    })

    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false
    })
    return new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.25), mat)
  }

  onEnter() { EventBus.emit('audio:zone', 'archive') }
  onExit()  {}

  update(t) {
    this.cards.forEach(c => {
      c.position.y = c.userData.baseY + Math.sin(t * 0.55 + c.userData.phase) * 0.09
    })
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
