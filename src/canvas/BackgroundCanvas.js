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

function renderBallGlow(timestamp) {
  const alpha = (Math.sin(timestamp / 500) * 0.5 + 0.5) * 0.15
  const g = ctx.createRadialGradient(mx, my, 0, mx, my, 120)
  g.addColorStop(0, `rgba(255,215,0,${alpha})`)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function getTargetZones() {
  const zones = []

  const nameI = document.getElementById('name-i')
  if (nameI) {
    const r = nameI.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) {
      zones.push({ x: r.left + r.width / 2, y: r.top, radius: 30 })
    }
  }

  const logo = document.getElementById('logo-canvas')
  if (logo) {
    const r = logo.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) {
      zones.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, radius: 50 })
    }
  }

  return zones
}

function renderTargetZones(timestamp, zones) {
  const fadeIn = Math.min((timestamp - ballFormedAt) / 300, 1)
  const pulse  = 1 + Math.sin(timestamp / 400) * 0.5

  for (const z of zones) {
    const alpha = fadeIn * 0.6
    ctx.beginPath()
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,215,0,${alpha})`
    ctx.lineWidth = pulse
    ctx.stroke()
  }
}

function renderExplosion(timestamp) {
  const elapsed = timestamp - explosionStartTime
  const ox = explosionOrigin.x
  const oy = explosionOrigin.y
  const maxR = Math.sqrt(W * W + H * H)

  // White flash (0–80ms)
  if (elapsed < 80) {
    const flashAlpha = Math.max(0, 1 - elapsed / 80) * 0.9
    const flash = ctx.createRadialGradient(ox, oy, 0, ox, oy, maxR)
    flash.addColorStop(0, `rgba(255,255,255,${flashAlpha})`)
    flash.addColorStop(0.15, `rgba(255,215,0,${flashAlpha * 0.6})`)
    flash.addColorStop(1, 'transparent')
    ctx.fillStyle = flash
    ctx.fillRect(0, 0, W, H)
  }

  // 3 shockwave rings staggered 150ms apart
  for (let i = 0; i < 3; i++) {
    const ringStart   = i * 150
    const ringElapsed = elapsed - ringStart
    if (ringElapsed < 0 || ringElapsed > 600) continue
    const progress  = ringElapsed / 600
    const ringR     = progress * maxR * 0.8
    const ringAlpha = (1 - progress) * 0.8
    ctx.beginPath()
    ctx.arc(ox, oy, ringR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,215,0,${ringAlpha})`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Motion trails (velocity-based opacity)
  for (const p of particles) {
    const speed      = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const trailAlpha = Math.min(speed / 25, 1) * 0.6
    if (trailAlpha < 0.01) continue
    ctx.beginPath()
    ctx.moveTo(p.prevX, p.prevY)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = p.gold
      ? `rgba(255,215,0,${trailAlpha})`
      : `rgba(255,255,255,${trailAlpha})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

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

  // ── Ball glow (drawn before particles so particles render on top) ──
  if (eggState === 'BALL_FORMED') {
    renderBallGlow(timestamp)
  }

  // ── Particles ──────────────────────────────────────────────
  for (const p of particles) {
    p.prevX = p.x
    p.prevY = p.y
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

  // ── Target zone rings (BALL_FORMED only, after particles, before grain) ──
  const zones = eggState === 'BALL_FORMED' ? getTargetZones() : []
  if (eggState === 'BALL_FORMED') {
    renderTargetZones(timestamp, zones)
  }

  // ── Explosion (after particles, before grain) ──────────
  if (eggState === 'EXPLODING') {
    renderExplosion(timestamp)
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
    } else if (eggState === 'BALL_FORMED') {
      if (!checkBallFormed()) {
        eggState = 'DRIFT'
      } else {
        for (const z of zones) {
          const dx = mx - z.x
          const dy = my - z.y
          if (Math.sqrt(dx * dx + dy * dy) < z.radius) {
            eggState = 'EXPLODING'
            explosionStartTime = timestamp
            explosionOrigin = { x: z.x, y: z.y }
            for (const p of particles) {
              p.vx = (Math.random() - 0.5) * 50
              p.vy = (Math.random() - 0.5) * 50
            }
            break
          }
        }
      }
    } else if (eggState === 'EXPLODING') {
      if (timestamp - explosionStartTime >= 1200) {
        eggState = 'DRIFT'
      }
    }
  }
}
