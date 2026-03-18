import * as THREE from 'three'
import { streamDialogue } from '../api/ClaudeClient.js'

const BW = 320, BH = 160   // canvas px

export class SpeechBubble {
  constructor(npcId) {
    this.npcId    = npcId
    this._visible = false
    this._opacity = 0
    this._cancelled = false
    this._cycling   = false

    const canvas = document.createElement('canvas')
    canvas.width  = BW
    canvas.height = BH
    this._canvas  = canvas
    this._ctx     = canvas.getContext('2d')

    this._texture = new THREE.CanvasTexture(canvas)
    this._mat     = new THREE.SpriteMaterial({
      map: this._texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })

    this.sprite = new THREE.Sprite(this._mat)
    // Scale to world units — 320/160 aspect = 2.4 × 1.2
    this.sprite.scale.set(2.4, 1.2, 1)
    this.sprite.position.set(0, 4.3, 0)

    this._drawEmpty()
  }

  show() {
    if (this._visible) return
    this._visible   = true
    this._cancelled = false
    this._startStream()
  }

  hide() {
    this._visible   = false
    this._cancelled = true
    this._cycling   = false
  }

  update(delta) {
    const target = this._visible ? 1 : 0
    this._opacity += (target - this._opacity) * Math.min(1, delta * 5)
    this._mat.opacity = this._opacity
  }

  // ── Private ─────────────────────────────────────────────────

  _drawEmpty() {
    const ctx = this._ctx
    ctx.clearRect(0, 0, BW, BH)
  }

  _drawText(text) {
    const ctx = this._ctx
    ctx.clearRect(0, 0, BW, BH)

    // Bubble background
    ctx.fillStyle = 'rgba(6, 10, 20, 0.82)'
    ctx.roundRect(4, 4, BW - 8, BH - 8, 10)
    ctx.fill()

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.roundRect(4, 4, BW - 8, BH - 8, 10)
    ctx.stroke()

    // Text — wrap at ~36 chars
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px "Inter", sans-serif'
    ctx.textAlign = 'left'
    const words = text.split(' ')
    let line = '', y = 30
    words.forEach(word => {
      const test = line + word + ' '
      if (ctx.measureText(test).width > BW - 28) {
        ctx.fillText(line, 14, y)
        line = word + ' '
        y += 20
      } else {
        line = test
      }
    })
    ctx.fillText(line, 14, y)

    this._texture.needsUpdate = true
  }

  async _startStream() {
    this._cancelled = false
    this._cycling   = true
    let accumulated = ''

    try {
      for await (const chunk of streamDialogue(this.npcId)) {
        if (this._cancelled) break
        accumulated += chunk
        this._drawText(accumulated)
      }
    } catch (_) {}

    if (!this._cancelled && this._cycling) {
      // Auto-cycle: wait 6s then show next dialogue
      await _delay(6000)
      if (!this._cancelled && this._visible) {
        accumulated = ''
        this._startStream()
      }
    }
  }
}

const _delay = ms => new Promise(r => setTimeout(r, ms))
