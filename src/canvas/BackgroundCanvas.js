// src/canvas/BackgroundCanvas.js

let canvas, ctx, W, H
let mx = 0, my = 0
let grainFrames = []
let grainIndex = 0
let lastGrainSwap = 0
let particles = []
let isTouch = false
let paused = false

// ── Easter egg state machine ────────────────────────────
let eggState = 'DRIFT'          // 'DRIFT' | 'BALL_FORMED' | 'EXPLODING'
let ballFormedAt = 0            // timestamp when BALL_FORMED was entered
let explosionStartTime = 0      // timestamp when EXPLODING was entered
let explosionOrigin = { x: 0, y: 0 } // target zone center that triggered explosion

const PARTICLE_COUNT  = () => 90
const GRAIN_FRAMES    = () => isTouch ? 3 : 6
const GRAIN_SCALE     = () => isTouch ? 0.5 : 1   // render grain at half-res on mobile

function buildGrainFrames() {
  grainFrames = []
  const scale = GRAIN_SCALE()
  const gW = Math.ceil(W * scale)
  const gH = Math.ceil(H * scale)
  for (let i = 0; i < GRAIN_FRAMES(); i++) {
    const off = document.createElement('canvas')
    off.width  = gW
    off.height = gH
    const c  = off.getContext('2d')
    const id = c.createImageData(gW, gH)
    const d  = id.data
    for (let j = 0; j < d.length; j += 4) {
      const v = Math.random() * 255 | 0
      d[j] = d[j + 1] = d[j + 2] = v
      d[j + 3] = (Math.random() * 55 + 12) | 0
    }
    c.putImageData(id, 0, 0)
    grainFrames.push(off)
  }
}

function buildParticles() {
  particles = Array.from({ length: PARTICLE_COUNT() }, () => ({
    x:     Math.random() * W,
    y:     Math.random() * H,
    vx:    (Math.random() - 0.5) * 0.5,
    vy:    (Math.random() - 0.5) * 0.5,
    r:     Math.random() * 2 + 0.8,
    gold:  Math.random() < 0.25,
    prevX: 0,
    prevY: 0,
  }))
}

function checkBallFormed() {
  for (const p of particles) {
    const dx = p.x - mx
    const dy = p.y - my
    if (Math.sqrt(dx * dx + dy * dy) > 100) return false
  }
  return true
}

function onResize() {
  W = canvas.width  = window.innerWidth
  H = canvas.height = window.innerHeight
  buildGrainFrames()
  for (const p of particles) {
    p.x = Math.min(p.x, W)
    p.y = Math.min(p.y, H)
  }
}

export function initBackgroundCanvas() {
  isTouch = !window.matchMedia('(hover: hover)').matches

  // Use the <canvas id="bg"> declared in index.html
  canvas = document.getElementById('bg')
  ctx    = canvas.getContext('2d')

  W = canvas.width  = window.innerWidth
  H = canvas.height = window.innerHeight

  buildGrainFrames()
  buildParticles()

  mx = W / 2
  my = H / 2
  if (!isTouch) {
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  } else {
    // Tap updates mx/my — same attraction model as desktop cursor
    window.addEventListener('touchstart', e => {
      const t = e.changedTouches[0]
      mx = t.clientX
      my = t.clientY
    }, { passive: true })
  }

  window.addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden
  })
}

export function updateBackgroundCanvas(timestamp) {
  if (paused) return

  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, W, H)

  // ── Particles ──────────────────────────────────────────────
  for (const p of particles) {
    const dx = mx - p.x
    const dy = my - p.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < 200) {
      const f = (200 - d) / 200
      p.vx += dx * f * 0.0008
      p.vy += dy * f * 0.0008
    }
    p.vx *= 0.98
    p.vy *= 0.98
    p.x  += p.vx
    p.y  += p.vy
    if (p.x < 0) p.x = W;  if (p.x > W) p.x = 0
    if (p.y < 0) p.y = H;  if (p.y > H) p.y = 0

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.gold ? 'rgba(255,215,0,0.75)' : 'rgba(255,255,255,0.55)'
    ctx.fill()

    for (const q of particles) {
        if (q === p) continue
        const dx2 = p.x - q.x
        const dy2 = p.y - q.y
        const d2  = Math.sqrt(dx2 * dx2 + dy2 * dy2)
        if (d2 < 110) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(q.x, q.y)
          const a = (1 - d2 / 110) * 0.25
          ctx.strokeStyle = (p.gold || q.gold)
            ? `rgba(255,215,0,${a})`
            : `rgba(255,255,255,${a})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }
  }

  // Cursor / tap glow
  {
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 140)
    g.addColorStop(0, 'rgba(255,215,0,0.07)')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  // ── Grain ──────────────────────────────────────────────────
  if (timestamp - lastGrainSwap > 50) {
    grainIndex    = (grainIndex + 1) % GRAIN_FRAMES()
    lastGrainSwap = timestamp
  }
  if (grainFrames[grainIndex]) {
    ctx.globalAlpha = 0.35
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(grainFrames[grainIndex], 0, 0, W, H)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── Vignette ───────────────────────────────────────────────
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.85)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)

  // ── Easter egg state transitions ───────────────────────
  if (!isTouch) {
    if (eggState === 'DRIFT' && checkBallFormed()) {
      eggState = 'BALL_FORMED'
      ballFormedAt = timestamp
    } else if (eggState === 'BALL_FORMED' && !checkBallFormed()) {
      eggState = 'DRIFT'
    }
  }
}
