import * as THREE from 'three'
import { makeCanvasTexture } from '../utils/GeometryUtils.js'
import { EventBus } from '../utils/EventBus.js'

const QUOTES = [
  { text: '"Infrastructure first. Features second. Everything else is decoration."', attr: '— Ayoola Morakinyo' },
  { text: '"The boring stuff is the competitive moat. Anyone can build a nice UI. Very few build trust at scale."', attr: '— Founder\'s Log' },
  { text: '"Ownership is not a buzzword. It\'s the architecture of wealth. Build the rails and let others run on them."', attr: '— MDFLD Vision Document' },
  { text: '"Discipline without vision is just repetition. Vision without discipline is just daydreaming."', attr: '— Locker Room Wall' },
  { text: '"The football economy is real. The infrastructure to support it doesn\'t exist yet. That\'s the gap."', attr: '— Pitch Deck, 2024' },
  { text: '"Build for the collector who values provenance. Build for the seller who deserves trust. Build for the market that deserves better."', attr: '— MDFLD Manifesto' },
]

export class LockerRoom {
  constructor() {
    this.group = new THREE.Group()
    this.cards = []
  }

  build(scene) {
    this.group.position.set(58, 0, 26)

    // Room shell
    const wallMat  = new THREE.MeshLambertMaterial({ color: 0x0d1525 })
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x141c28 })

    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.15, 18), floorMat)
    floor.position.y = -0.07
    this.group.add(floor)

    // Tiled floor texture hint — darker grout lines
    const tileMat = new THREE.MeshLambertMaterial({ color: 0x0a1018 })
    for (let tx = -3; tx <= 3; tx++) {
      const grout = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 18), tileMat)
      grout.position.set(tx * 2.2, 0.01, 0)
      this.group.add(grout)
    }

    // Walls
    ;[
      { sz: [18, 6, 0.2], pos: [0, 3, -9]  },
      { sz: [18, 6, 0.2], pos: [0, 3,  9]  },
      { sz: [0.2, 6, 18], pos: [-9, 3, 0]  },
      { sz: [0.2, 6, 18], pos: [ 9, 3, 0]  },
    ].forEach(({ sz, pos }) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(...sz), wallMat)
      w.position.set(...pos)
      this.group.add(w)
    })

    // Locker units along the back wall
    const lockerMat    = new THREE.MeshLambertMaterial({ color: 0x1a2a3a })
    const lockerDoorMat = new THREE.MeshLambertMaterial({ color: 0x0d1f2e })
    const handleMat    = new THREE.MeshLambertMaterial({ color: 0x8ab0c8 })
    for (let li = -4; li <= 4; li++) {
      const lx = li * 1.9
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.8, 0.6), lockerMat)
      body.position.set(lx, 1.9, -8.6)
      this.group.add(body)
      // Door panel
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.6, 0.08), lockerDoorMat)
      door.position.set(lx, 1.9, -8.27)
      this.group.add(door)
      // Handle
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.12), handleMat)
      handle.position.set(lx + 0.55, 1.9, -8.2)
      this.group.add(handle)
      // Number plate (coloured strip at top)
      const stripColors = [0x1a3a8f, 0xc41e3a, 0xffd700, 0x00c853]
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.22, 0.09),
        new THREE.MeshBasicMaterial({ color: stripColors[Math.abs(li) % 4] })
      )
      strip.position.set(lx, 3.65, -8.22)
      this.group.add(strip)
    }

    // Long team bench
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x2a3545 })
    const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.28, 1.4), benchMat)
    bench.position.set(0, 0.14, 5.5)
    this.group.add(bench)
    // Bench legs
    ;[-6, -3, 0, 3, 6].forEach(bx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.2), benchMat)
      leg.position.set(bx, -0.1, 5.5)
      this.group.add(leg)
    })

    // Overhead strip lights
    const lightBarMat = new THREE.MeshBasicMaterial({ color: 0x8ab4d4 })
    ;[-4, 0, 4].forEach(lx => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.3), lightBarMat)
      bar.position.set(lx, 5.7, 0)
      this.group.add(bar)
    })

    // Ambient glow light
    const glow = new THREE.PointLight(0x2050aa, 2.2, 22)
    glow.position.set(0, 5, 0)
    this.group.add(glow)

    // Quote cards floating around the room
    QUOTES.forEach((q, i) => {
      const angle = (i / QUOTES.length) * Math.PI * 2
      const radius = 6.5
      const card = this._makeQuoteCard(q, i)
      card.position.set(
        Math.sin(angle) * radius,
        2.2 + (i % 2) * 0.5,
        Math.cos(angle) * radius
      )
      card.rotation.y = -angle
      card.userData.baseY = card.position.y
      card.userData.phase = i * 1.1
      this.group.add(card)
      this.cards.push(card)
    })

    scene.add(this.group)
  }

  _makeQuoteCard(q, index) {
    const colors = ['#ffd700', '#00e5ff', '#f44336', '#00c853', '#ffd700', '#00e5ff']
    const c = colors[index % colors.length]

    const tex = makeCanvasTexture(600, 280, (ctx, cw, ch) => {
      ctx.fillStyle = 'rgba(5, 10, 22, 0.93)'
      ctx.fillRect(0, 0, cw, ch)

      // Left accent
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 5, ch)

      // Quotation mark
      ctx.fillStyle = c
      ctx.font = 'bold 64px Georgia, serif'
      ctx.globalAlpha = 0.18
      ctx.fillText('"', 16, 70)
      ctx.globalAlpha = 1

      // Quote text
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      ctx.font = 'italic 19px Inter, serif'
      _wrapText(ctx, q.text, 20, 36, cw - 36, 28)

      // Attribution
      ctx.fillStyle = c
      ctx.font = '15px Orbitron, Arial'
      ctx.fillText(q.attr, 20, ch - 20)

      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      ctx.strokeRect(1, 1, cw - 2, ch - 2)
    })

    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false
    })
    return new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.68), mat)
  }

  onEnter() { EventBus.emit('audio:zone', 'lockerRoom') }
  onExit()  {}

  update(t) {
    this.cards.forEach((c, i) => {
      c.position.y = c.userData.baseY + Math.sin(t * 0.7 + c.userData.phase) * 0.12
      c.rotation.y += 0.0003
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
