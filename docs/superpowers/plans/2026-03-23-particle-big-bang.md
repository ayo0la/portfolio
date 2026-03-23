# Particle Big Bang Easter Egg — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hidden easter egg where visitors herd all 90 canvas particles into a ball, hover it over the "I" in MORAKINYO or the spinning logo center, and trigger a cinematic Big Bang explosion that resets the loop.

**Architecture:** All interaction logic lives in `src/canvas/BackgroundCanvas.js` as a self-contained state machine (`DRIFT → BALL_FORMED → EXPLODING → DRIFT`). A single HTML change wraps the "I" character in a span for positional lookup. No new files created.

**Tech Stack:** Vanilla JS, Canvas 2D API, Vite dev server (`npm run dev`). No test framework — verification is browser-based with specific visual checks.

**Spec:** `docs/superpowers/specs/2026-03-23-particle-big-bang-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Modify line 26 | Wrap "I" in `<span id="name-i">` for DOM position lookup |
| `src/canvas/BackgroundCanvas.js` | Modify | State machine, ball detection, glow, target zones, explosion |

---

### Task 1: Wrap the "I" in a span

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Edit index.html**

Find line 26 in `index.html`:
```html
<h1 class="hero-name">AYOOLA<br>MORAKINYO</h1>
```
Change to:
```html
<h1 class="hero-name">AYOOLA<br>MORAK<span id="name-i">I</span>NYO</h1>
```

- [ ] **Step 2: Verify visually**

Run `npm run dev`. Open the site. Confirm:
- The heading still reads **AYOOLA / MORAKINYO** — no visual change.
- In DevTools Elements panel, `<span id="name-i">` exists wrapping the "I".
- `document.getElementById('name-i').getBoundingClientRect()` in console returns a valid rect with non-zero width/height.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wrap name-i span for particle target zone lookup"
```

---

### Task 2: Add state machine variables to BackgroundCanvas.js

**Files:**
- Modify: `src/canvas/BackgroundCanvas.js`

- [ ] **Step 1: Add state variables at the top of the file**

After the existing variable declarations (after `let paused = false` on line 10), add:

```js
// ── Easter egg state machine ────────────────────────────
let eggState = 'DRIFT'          // 'DRIFT' | 'BALL_FORMED' | 'EXPLODING'
let ballFormedAt = 0            // timestamp when BALL_FORMED was entered
let explosionStartTime = 0      // timestamp when EXPLODING was entered
let explosionOrigin = { x: 0, y: 0 } // target zone center that triggered explosion
```

- [ ] **Step 2: Add prevX/prevY to particle initialization in buildParticles()**

Find `buildParticles()` (line 38). Replace the object returned by the `Array.from` mapper:

```js
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
```

- [ ] **Step 3: Verify no breakage**

Run `npm run dev`. Site loads. Particles animate normally. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/canvas/BackgroundCanvas.js
git commit -m "feat: add easter egg state machine variables and prevX/prevY to particles"
```

---

### Task 3: Implement checkBallFormed() and state transition DRIFT → BALL_FORMED

**Files:**
- Modify: `src/canvas/BackgroundCanvas.js`

- [ ] **Step 1: Add checkBallFormed() function**

Add after the `buildParticles` function:

```js
function checkBallFormed() {
  for (const p of particles) {
    const dx = p.x - mx
    const dy = p.y - my
    if (Math.sqrt(dx * dx + dy * dy) > 100) return false
  }
  return true
}
```

- [ ] **Step 2: Integrate state transitions into updateBackgroundCanvas()**

In `updateBackgroundCanvas(timestamp)`, find the early return guard `if (paused) return`. Add an `isTouch` guard directly after it:

```js
if (paused) return
if (isTouch) { /* skip easter egg entirely on touch devices */ }
```

Then at the very end of `updateBackgroundCanvas`, just before the closing `}`, add the state transition logic:

```js
  // ── Easter egg state transitions ───────────────────────
  if (!isTouch) {
    if (eggState === 'DRIFT' && checkBallFormed()) {
      eggState = 'BALL_FORMED'
      ballFormedAt = timestamp
    } else if (eggState === 'BALL_FORMED' && !checkBallFormed()) {
      eggState = 'DRIFT'
    }
  }
```

- [ ] **Step 3: Verify in browser**

Open the site. Open DevTools Console. Paste:
```js
// Manually force all particles to cursor position to test
```
Instead, move cursor to the centre of the screen and hold still for 20–30 seconds while slowly sweeping the canvas edges to herd particles. When all cluster, open console and check:
```js
// Temporarily add a log to confirm — add this line inside the 'DRIFT && checkBallFormed()' block:
console.log('BALL_FORMED')
```
Rebuild, confirm `BALL_FORMED` logs when particles cluster.

Remove the `console.log` after confirming.

- [ ] **Step 4: Commit**

```bash
git add src/canvas/BackgroundCanvas.js
git commit -m "feat: add checkBallFormed and DRIFT/BALL_FORMED state transitions"
```

---

### Task 4: Render ball glow in BALL_FORMED state

**Files:**
- Modify: `src/canvas/BackgroundCanvas.js`

- [ ] **Step 1: Add renderBallGlow() function**

Add after `checkBallFormed()`:

```js
function renderBallGlow(timestamp) {
  const alpha = (Math.sin(timestamp / 500) * 0.5 + 0.5) * 0.15
  const g = ctx.createRadialGradient(mx, my, 0, mx, my, 120)
  g.addColorStop(0, `rgba(255,215,0,${alpha})`)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
```

- [ ] **Step 2: Call renderBallGlow() in updateBackgroundCanvas()**

In `updateBackgroundCanvas`, find the line `ctx.fillStyle = '#080808'` (the background clear). Add the glow call immediately after the background clear and **before** the particle loop:

```js
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, W, H)

  // ── Ball glow (drawn before particles so particles render on top) ──
  if (eggState === 'BALL_FORMED' || eggState === 'EXPLODING') {
    renderBallGlow(timestamp)
  }

  // ── Particles ──────────────────────────────────── (existing code follows)
```

- [ ] **Step 3: Verify in browser**

Herd all particles to cursor. A gold radial glow should pulse around the cursor position (very subtle, 0–15% opacity). Particles still render on top.

- [ ] **Step 4: Commit**

```bash
git add src/canvas/BackgroundCanvas.js
git commit -m "feat: add pulsing ball glow for BALL_FORMED state"
```

---

### Task 5: Implement target zone detection and ring indicators

**Files:**
- Modify: `src/canvas/BackgroundCanvas.js`

- [ ] **Step 1: Add getTargetZones() function**

Add after `renderBallGlow()`:

```js
function getTargetZones() {
  const zones = []

  const nameI = document.getElementById('name-i')
  if (nameI) {
    const r = nameI.getBoundingClientRect()
    if (r.top < window.innerHeight && r.bottom > 0) {
      zones.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, radius: 30 })
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
```

- [ ] **Step 2: Add renderTargetZones() function**

Add after `getTargetZones()`:

```js
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
```

- [ ] **Step 3: Add hover check and BALL_FORMED → EXPLODING transition**

In the state transition block added in Task 3, extend it to check target zone hover. Replace the existing state transition block at the end of `updateBackgroundCanvas`:

```js
  // ── Easter egg state transitions ───────────────────────
  if (!isTouch) {
    if (eggState === 'DRIFT' && checkBallFormed()) {
      eggState = 'BALL_FORMED'
      ballFormedAt = timestamp
    } else if (eggState === 'BALL_FORMED') {
      if (!checkBallFormed()) {
        eggState = 'DRIFT'
      } else {
        // Check for hover over a target zone
        const zones = getTargetZones()
        for (const z of zones) {
          const dx = mx - z.x
          const dy = my - z.y
          if (Math.sqrt(dx * dx + dy * dy) < z.radius) {
            eggState = 'EXPLODING'
            explosionStartTime = timestamp
            explosionOrigin = { x: z.x, y: z.y }
            break
          }
        }
      }
    }
  }
```

- [ ] **Step 4: Call renderTargetZones() in updateBackgroundCanvas()**

In `updateBackgroundCanvas`, in the particle section — after the particle loop ends but **before** the grain section — add:

```js
  // ── Target zone rings (BALL_FORMED only, after particles, before grain) ──
  if (eggState === 'BALL_FORMED') {
    renderTargetZones(timestamp, getTargetZones())
  }
```

- [ ] **Step 5: Verify in browser**

Herd all particles together. Confirm:
- Faint gold ring appears around the "I" in MORAKINYO (visible on hero section).
- Faint gold ring appears around the spinning logo.
- Rings pulse subtly and fade in over ~300ms.
- Moving cursor away so particles scatter makes rings disappear.

- [ ] **Step 6: Commit**

```bash
git add src/canvas/BackgroundCanvas.js
git commit -m "feat: add target zone detection and pulsing ring indicators"
```

---

### Task 6: Implement the Big Bang explosion

**Files:**
- Modify: `src/canvas/BackgroundCanvas.js`

- [ ] **Step 1: Add renderExplosion() function**

Add after `renderTargetZones()`:

```js
function renderExplosion(timestamp) {
  const elapsed = timestamp - explosionStartTime
  const ox = explosionOrigin.x
  const oy = explosionOrigin.y
  const maxR = Math.sqrt(W * W + H * H)

  // White flash (0–80ms)
  if (elapsed < 400) {
    const flashAlpha = Math.max(0, 1 - elapsed / 80) * 0.9
    if (flashAlpha > 0) {
      const flash = ctx.createRadialGradient(ox, oy, 0, ox, oy, maxR)
      flash.addColorStop(0, `rgba(255,255,255,${flashAlpha})`)
      flash.addColorStop(0.15, `rgba(255,215,0,${flashAlpha * 0.6})`)
      flash.addColorStop(1, 'transparent')
      ctx.fillStyle = flash
      ctx.fillRect(0, 0, W, H)
    }
  }

  // 3 shockwave rings staggered 150ms apart
  for (let i = 0; i < 3; i++) {
    const ringStart = i * 150
    const ringElapsed = elapsed - ringStart
    if (ringElapsed < 0 || ringElapsed > 600) continue
    const progress = ringElapsed / 600
    const ringR    = progress * maxR * 0.8
    const ringAlpha = (1 - progress) * 0.8
    ctx.beginPath()
    ctx.arc(ox, oy, ringR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,215,0,${ringAlpha})`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Motion trails (velocity-based opacity)
  for (const p of particles) {
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
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

  // Reset to DRIFT after 1200ms
  if (elapsed >= 1200) {
    eggState = 'DRIFT'
  }
}
```

- [ ] **Step 2: Kick particle velocities on explosion start**

In the state transition block (Task 5, Step 3), find the line where `eggState = 'EXPLODING'` is set. Add the velocity kick immediately after:

```js
            eggState = 'EXPLODING'
            explosionStartTime = timestamp
            explosionOrigin = { x: z.x, y: z.y }
            // Kick all particles outward
            for (const p of particles) {
              p.vx = (Math.random() - 0.5) * 50
              p.vy = (Math.random() - 0.5) * 50
            }
            break
```

- [ ] **Step 3: Call renderExplosion() and update prevX/prevY in updateBackgroundCanvas()**

In the particle loop (lines 98–135 in the original file), add `prevX/prevY` update at the start of the loop body, just before `const dx = mx - p.x`:

```js
  for (const p of particles) {
    p.prevX = p.x   // ← add this
    p.prevY = p.y   // ← add this
    const dx = mx - p.x
    // ... rest of existing particle loop unchanged ...
```

Then, after the existing particle loop ends and after the target zone rings block (Task 5 Step 4), add:

```js
  // ── Explosion (after particles, before grain) ──────────
  if (eggState === 'EXPLODING') {
    renderExplosion(timestamp)
  }
```

- [ ] **Step 4: Verify the full loop in browser**

Run `npm run dev`. Full flow:
1. Move cursor around canvas, herding particles together.
2. Hold cursor still until all particles cluster → gold glow pulses, target rings appear.
3. Move clustered ball to the "I" in MORAKINYO → white flash, 3 gold shockwave rings expand, particles fly outward with trails.
4. ~1.2s later, particles are scattered and resume normal drift.
5. Repeat from step 1 — loop works.

Also verify:
- Moving cursor away while ball is forming reverts to DRIFT (no rings, no glow).
- Logo center target also triggers explosion when hovered with ball.
- Grain and vignette still render on top of the explosion effects.

- [ ] **Step 5: Commit**

```bash
git add src/canvas/BackgroundCanvas.js
git commit -m "feat: implement Big Bang explosion with flash, shockwave rings, and particle trails"
```

---

### Task 7: Final build check

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Open the preview URL. Run through the full easter egg loop once to confirm it works identically to dev mode.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: particle big bang easter egg complete"
```
