import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'

const EXPERIMENTS = [
  { title: 'Auth Layer v0', tag: 'SHIPPED', stack: 'Supabase · Next.js', desc: 'First working authentication flow with email magic links. Proved the backend could handle trust-gated listings.' },
  { title: 'Listing Prototype', tag: 'ITERATED', stack: 'React · Postgres', desc: 'Early UI for boot and kit listings. Discovered that verification UI needed to be first-class, not an add-on.' },
  { title: 'Verification Flow', tag: 'IN PROGRESS', stack: 'Claude API · Supabase', desc: 'AI-assisted provenance checks and trust scoring. Using LLMs to extract item details and flag inconsistencies.' },
  { title: 'Shipping Corridor Test', tag: 'RESEARCH', stack: 'Stripe · ShipEngine', desc: 'Testing cross-border shipping from UK to EU post-Brexit. Customs paperwork is the unsexy moat.' },
  { title: 'Community Seeding', tag: 'ACTIVE', stack: 'Discord · Instagram', desc: 'Building the collector community before the product is fully live. 400+ members pre-waitlist.' },
  { title: 'Trust Score Engine', tag: 'PROTOTYPING', stack: 'Python · Claude', desc: 'Algorithmic trust scores based on listing history, verification rate, response time, and community feedback.' },
]

const TAG_COLORS = {
  'SHIPPED': '#00c853',
  'ITERATED': '#00e5ff',
  'IN PROGRESS': '#ffd700',
  'RESEARCH': '#9c27b0',
  'ACTIVE': '#f44336',
  'PROTOTYPING': '#ff6d00',
}

export class TransferMarket {
  constructor() {
    this.group = new THREE.Group()
    this.cards = []
  }

  build(scene) {
    this.group.position.set(-58, 0, -26)

    // Room floor
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x0a1020 })
    const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.15, 18), floorMat)
    floor.position.y = -0.07
    this.group.add(floor)

    // Light
    const light = new THREE.PointLight(0x002244, 2, 22)
    light.position.set(0, 6, 0)
    this.group.add(light)

    // Cards in 2 rows of 3
    EXPERIMENTS.forEach((exp, i) => {
      const row = Math.floor(i / 3)
      const col = i % 3
      const card = this._makeCard(exp)
      card.position.set(
        (col - 1) * 4.8,
        1.6 + row * 2.8,
        0
      )
      card.userData.baseY = card.position.y
      card.userData.phase = i * 0.7
      this.group.add(card)
      this.cards.push(card)
    })

    // Header title
    const headerTex = makeCanvasTexture(800, 80, (ctx, cw, ch) => {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 36px Orbitron, Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('TRANSFER MARKET — MDFLD EXPERIMENTS', cw / 2, ch / 2)
    })
    const header = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1),
      new THREE.MeshBasicMaterial({ map: headerTex, transparent: true, side: THREE.DoubleSide })
    )
    header.position.set(0, 6.5, 0)
    this.group.add(header)

    scene.add(this.group)
  }

  _makeCard(exp) {
    const tagColor = TAG_COLORS[exp.tag] || '#ffffff'
    const tex = makeCanvasTexture(512, 300, (ctx, cw, ch) => {
      ctx.fillStyle = 'rgba(6, 12, 28, 0.94)'
      ctx.fillRect(0, 0, cw, ch)

      // Top tag bar
      ctx.fillStyle = tagColor
      ctx.fillRect(0, 0, cw, 5)

      // Tag pill
      ctx.fillStyle = tagColor
      ctx.font = 'bold 15px Orbitron, Arial'
      const tw = ctx.measureText(exp.tag).width + 20
      ctx.beginPath()
      ctx.roundRect(cw - tw - 14, 14, tw, 22, 4)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.textBaseline = 'middle'
      ctx.fillText(exp.tag, cw - tw - 4, 25)

      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 26px Orbitron, Arial'
      ctx.textBaseline = 'top'
      ctx.fillText(exp.title, 16, 18)

      // Stack
      ctx.fillStyle = 'rgba(0,229,255,0.7)'
      ctx.font = '16px Inter, Arial'
      ctx.fillText(exp.stack, 16, 58)

      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.beginPath(); ctx.moveTo(16, 84); ctx.lineTo(cw - 16, 84); ctx.stroke()

      // Desc
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.font = '18px Inter, Arial'
      _wrapText(ctx, exp.desc, 16, 100, cw - 32, 26)

      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, cw - 2, ch - 2)
    })

    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false
    })
    return new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.25), mat)
  }

  onEnter() { EventBus.emit('audio:zone', 'transferMarket') }
  onExit()  {}

  update(t) {
    this.cards.forEach(c => {
      c.position.y = c.userData.baseY + Math.sin(t * 0.5 + c.userData.phase) * 0.08
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
