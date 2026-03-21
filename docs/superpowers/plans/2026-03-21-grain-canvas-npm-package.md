# @ayoola/grain-canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the portfolio background canvas effect into a standalone, published npm package `@ayoola/grain-canvas` with zero dependencies, full config, ESM + CJS builds, and TypeScript declarations.

**Architecture:** Four source modules (`grain.js`, `particles.js`, `effects.js`, `index.js`) each with one clear responsibility, orchestrated by `index.js` which owns the animation loop, `ResizeObserver`, event listeners, and `destroy()`. `mergeConfig` in `index.js` handles all validation. No test framework — verification is visual via `demo/index.html`.

**Tech Stack:** Vanilla JS (ES2018), tsup (bundler), TypeScript (type checking + `.d.ts` generation via JSDoc), npm

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Package metadata, scripts, exports map |
| `tsup.config.js` | Create | Build config with `.esm.js`/`.cjs.js` output extensions |
| `tsconfig.json` | Create | `allowJs` + `checkJs` for `--dts` on plain JS |
| `.gitignore` | Create | Ignore `dist/`, `node_modules/` |
| `src/grain.js` | Create | Grain frame generation + draw logic |
| `src/particles.js` | Create | Particle init, update, draw, connection lines |
| `src/effects.js` | Create | Cursor glow + vignette |
| `src/index.js` | Create | `defaults`, `mergeConfig`, `init`, animation loop, `destroy` |
| `demo/index.html` | Create | Full-screen visual test, imports from `src/` |
| `README.md` | Create | Install, usage, config table, React example, known limitations |

---

## Task 1: Scaffold the package

**Files:**
- Create: `package.json`
- Create: `tsup.config.js`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Initialise git repo and create package.json**

```bash
mkdir -p /Users/ayoola/Desktop/grain-canvas
cd /Users/ayoola/Desktop/grain-canvas
git init
```

Create `package.json`:
```json
{
  "name": "@ayoola/grain-canvas",
  "version": "0.1.0",
  "description": "Animated grain overlay + particle system canvas background. Zero dependencies, fully configurable.",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    }
  },
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.esm.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "demo": "npx serve .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create tsup.config.js**

```js
// tsup.config.js
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs'],
  dts: true,
  outExtension({ format }) {
    return { js: format === 'esm' ? '.esm.js' : '.cjs.js' }
  },
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["DOM", "ES2018"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
```

- [ ] **Step 5: Install dev dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 6: Create src/ directory and commit scaffold**

```bash
mkdir src demo
git add .
git commit -m "chore: scaffold @ayoola/grain-canvas package"
```

---

## Task 2: Implement `src/grain.js`

**Files:**
- Create: `src/grain.js`

- [ ] **Step 1: Write grain.js**

```js
// src/grain.js

/**
 * Build an array of pre-rendered offscreen grain canvases.
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 * @param {object} config - merged config
 * @param {boolean} isTouch - true on touch devices
 * @returns {HTMLCanvasElement[]}
 */
export function buildGrainFrames(W, H, config, isTouch) {
  const frames = isTouch ? 3 : 6
  const scale  = isTouch ? 0.5 : 1
  const gW = Math.ceil(W * scale)
  const gH = Math.ceil(H * scale)
  const result = []

  for (let i = 0; i < frames; i++) {
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
    result.push(off)
  }
  return result
}

/**
 * Draw the current grain frame onto the main canvas.
 * Uses 'screen' blend mode — works correctly only on dark backgrounds.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement[]} frames
 * @param {number} index - current frame index
 * @param {number} W
 * @param {number} H
 * @param {object} config
 */
export function drawGrain(ctx, frames, index, W, H, config) {
  if (!frames[index]) return
  ctx.globalAlpha = config.grainOpacity
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(frames[index], 0, 0, W, H)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/grain.js
git commit -m "feat: add grain frame generation and draw"
```

---

## Task 3: Implement `src/particles.js`

**Files:**
- Create: `src/particles.js`

- [ ] **Step 1: Write particles.js**

```js
// src/particles.js

/**
 * Build initial particle array.
 * @param {number} W
 * @param {number} H
 * @param {object} config
 * @returns {Array<{x:number,y:number,vx:number,vy:number,r:number,gold:boolean}>}
 */
export function buildParticles(W, H, config) {
  return Array.from({ length: config.particleCount }, () => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    vx:   (Math.random() - 0.5) * 0.5,
    vy:   (Math.random() - 0.5) * 0.5,
    r:    Math.random() * (config.particleSizeMax - config.particleSizeMin) + config.particleSizeMin,
    gold: Math.random() < config.accentRatio,
  }))
}

/**
 * Update particle positions — apply attraction toward (mx, my), damp velocity, wrap edges.
 * @param {Array} particles
 * @param {number} W
 * @param {number} H
 * @param {number} mx - attraction x (cursor or tap)
 * @param {number} my - attraction y
 * @param {object} config
 */
export function updateParticles(particles, W, H, mx, my, config) {
  for (const p of particles) {
    const dx = mx - p.x
    const dy = my - p.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    if (d < config.mouseAttractionRadius) {
      const f = (config.mouseAttractionRadius - d) / config.mouseAttractionRadius
      p.vx += dx * f * config.mouseAttractionStrength
      p.vy += dy * f * config.mouseAttractionStrength
    }
    p.vx *= 0.98
    p.vy *= 0.98
    p.x  += p.vx
    p.y  += p.vy
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
  }
}

/**
 * Draw particles and connection lines between nearby pairs.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} particles
 * @param {object} config
 */
export function drawParticles(ctx, particles, config) {
  for (const p of particles) {
    // Draw dot
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.gold ? config.particleAccentColor : config.particleBaseColor
    ctx.fill()

    // Draw connection lines to nearby particles
    for (const q of particles) {
      if (q === p) continue
      const dx = p.x - q.x
      const dy = p.y - q.y
      const d  = Math.sqrt(dx * dx + dy * dy)
      if (d < config.connectionDistance) {
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(q.x, q.y)
        const a = (1 - d / config.connectionDistance) * config.connectionOpacity
        ctx.strokeStyle = (p.gold || q.gold)
          ? `rgba(255,215,0,${a})`
          : `rgba(255,255,255,${a})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/particles.js
git commit -m "feat: add particle system — build, update, draw"
```

---

## Task 4: Implement `src/effects.js`

**Files:**
- Create: `src/effects.js`

- [ ] **Step 1: Write effects.js**

```js
// src/effects.js

/**
 * Draw a radial glow at the cursor/tap position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} mx
 * @param {number} my
 * @param {number} W
 * @param {number} H
 * @param {object} config
 */
export function drawGlow(ctx, mx, my, W, H, config) {
  const g = ctx.createRadialGradient(mx, my, 0, mx, my, config.glowRadius)
  g.addColorStop(0, config.glowColor)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

/**
 * Draw a vignette — darkens the canvas edges via a radial gradient.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {object} config
 */
export function drawVignette(ctx, W, H, config) {
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.85)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, `rgba(0,0,0,${config.vignetteOpacity})`)
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/effects.js
git commit -m "feat: add glow and vignette effects"
```

---

## Task 5: Implement `src/index.js` — the public API

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Write index.js**

```js
// src/index.js
import { buildGrainFrames, drawGrain } from './grain.js'
import { buildParticles, updateParticles, drawParticles } from './particles.js'
import { drawGlow, drawVignette } from './effects.js'

/** @type {Required<GrainCanvasOptions>} */
export const defaults = {
  backgroundColor:        '#080808',
  particleCount:          90,
  particleSizeMin:        0.8,
  particleSizeMax:        2.8,
  particleBaseColor:      'rgba(255,255,255,0.55)',
  particleAccentColor:    'rgba(255,215,0,0.75)',
  accentRatio:            0.25,
  mouseAttractionRadius:  200,
  mouseAttractionStrength:0.0008,
  connectionDistance:     110,
  connectionOpacity:      0.25,
  glowRadius:             140,
  glowColor:              'rgba(255,215,0,0.07)',
  grainOpacity:           0.35,
  grainSwapInterval:      50,
  vignetteOpacity:        0.6,
}

/**
 * Merge user options over defaults and clamp numeric values.
 * @param {Partial<GrainCanvasOptions>} userConfig
 * @returns {Required<GrainCanvasOptions>}
 */
function mergeConfig(userConfig = {}) {
  const c = { ...defaults, ...userConfig }
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
  c.particleCount           = clamp(Math.round(c.particleCount), 1, 500)
  c.accentRatio             = clamp(c.accentRatio, 0, 1)
  c.grainOpacity            = clamp(c.grainOpacity, 0, 1)
  c.vignetteOpacity         = clamp(c.vignetteOpacity, 0, 1)
  c.grainSwapInterval       = Math.max(33, c.grainSwapInterval)
  c.mouseAttractionRadius   = Math.max(1, c.mouseAttractionRadius)
  c.connectionDistance      = Math.max(1, c.connectionDistance)
  return c
}

/**
 * @typedef {object} GrainCanvasOptions
 * @property {string}  [backgroundColor]
 * @property {number}  [particleCount]
 * @property {number}  [particleSizeMin]
 * @property {number}  [particleSizeMax]
 * @property {string}  [particleBaseColor]
 * @property {string}  [particleAccentColor]
 * @property {number}  [accentRatio]
 * @property {number}  [mouseAttractionRadius]
 * @property {number}  [mouseAttractionStrength]
 * @property {number}  [connectionDistance]
 * @property {number}  [connectionOpacity]
 * @property {number}  [glowRadius]
 * @property {string}  [glowColor]
 * @property {number}  [grainOpacity]
 * @property {number}  [grainSwapInterval]
 * @property {number}  [vignetteOpacity]
 */

/**
 * Initialise the grain canvas effect.
 * The canvas is sized automatically via ResizeObserver.
 * Ensure the canvas has non-zero CSS dimensions before calling init.
 *
 * @param {HTMLCanvasElement} canvasEl
 * @param {GrainCanvasOptions} [options]
 * @returns {() => void} destroy function — safe to call multiple times
 */
export function init(canvasEl, options) {
  const config  = mergeConfig(options)
  const isTouch = !window.matchMedia('(hover: hover)').matches

  let W = canvasEl.clientWidth
  let H = canvasEl.clientHeight

  if (W === 0 || H === 0) {
    console.warn('[grain-canvas] Canvas has zero dimensions. Ensure CSS gives it a non-zero size before calling init().')
  }

  canvasEl.width  = W
  canvasEl.height = H

  const ctx = canvasEl.getContext('2d')

  let grainFrames    = buildGrainFrames(W, H, config, isTouch)
  let grainIndex     = 0
  let lastGrainSwap  = 0
  let particles      = buildParticles(W, H, config)
  let mx             = W / 2
  let my             = H / 2
  let rafId          = null
  let paused         = false
  let destroyed      = false

  // ── Resize ────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    W = canvasEl.clientWidth
    H = canvasEl.clientHeight
    canvasEl.width  = W
    canvasEl.height = H
    grainFrames = buildGrainFrames(W, H, config, isTouch)
    for (const p of particles) {
      p.x = Math.min(p.x, W)
      p.y = Math.min(p.y, H)
    }
  })
  ro.observe(canvasEl)

  // ── Input events ──────────────────────────────────────────────
  const onMouseMove = e => { mx = e.clientX; my = e.clientY }
  const onTouchStart = e => {
    const t = e.changedTouches[0]
    mx = t.clientX
    my = t.clientY
  }
  const onTouchEnd = () => {
    mx = W / 2
    my = H / 2
  }
  const onVisibility = () => { paused = document.hidden }

  if (!isTouch) {
    window.addEventListener('mousemove', onMouseMove)
  } else {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
  }
  document.addEventListener('visibilitychange', onVisibility)

  // ── Animation loop ────────────────────────────────────────────
  function frame(timestamp) {
    if (destroyed) return
    rafId = requestAnimationFrame(frame)
    if (paused) return

    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, 0, W, H)

    updateParticles(particles, W, H, mx, my, config)
    drawParticles(ctx, particles, config)
    drawGlow(ctx, mx, my, W, H, config)

    if (timestamp - lastGrainSwap > config.grainSwapInterval) {
      grainIndex    = (grainIndex + 1) % grainFrames.length
      lastGrainSwap = timestamp
    }
    drawGrain(ctx, grainFrames, grainIndex, W, H, config)
    drawVignette(ctx, W, H, config)
  }

  rafId = requestAnimationFrame(frame)

  // ── Destroy ───────────────────────────────────────────────────
  return function destroy() {
    if (destroyed) return
    destroyed = true
    cancelAnimationFrame(rafId)
    ro.disconnect()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    document.removeEventListener('visibilitychange', onVisibility)
    canvasEl = null  // release canvas ref to avoid memory leaks in SPA route changes
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors. If you see "Cannot find name 'requestAnimationFrame'" or similar, check that `"lib": ["DOM", "ES2018"]` is in `tsconfig.json`.

- [ ] **Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add public API — init, destroy, mergeConfig, defaults"
```

---

## Task 6: Build and verify output

**Files:**
- No new files — verifies `dist/` is generated correctly

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected output:
```
ESM dist/index.esm.js
CJS dist/index.cjs.js
DTS dist/index.d.ts
```

If tsup complains about `dts` on JS files, ensure `tsconfig.json` exists at root with `allowJs: true`.

- [ ] **Step 2: Verify exports map resolves**

Check `dist/` contains exactly:
- `index.esm.js`
- `index.cjs.js`
- `index.d.ts`

```bash
ls dist/
```

Expected: `index.cjs.js  index.d.ts  index.esm.js`

- [ ] **Step 3: Spot-check the .d.ts**

```bash
cat dist/index.d.ts
```

Expected: `init`, `defaults`, and `GrainCanvasOptions` are all present. If the file is empty or only has `export {}`, the JSDoc typedefs aren't being picked up — verify `"checkJs": true` in tsconfig.

- [ ] **Step 4: Confirm dist/ is gitignored**

`dist/` must not be committed — it is published via npm's `files` field, not git. Verify:

```bash
git status
```

Expected: `dist/` does not appear in the output. If it does, check `.gitignore` contains `dist/`.

---

## Task 7: Create `demo/index.html`

**Files:**
- Create: `demo/index.html`

- [ ] **Step 1: Write the demo**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>@ayoola/grain-canvas demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #080808; width: 100vw; height: 100vh; overflow: hidden; }
    canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .label {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.3);
      font-family: monospace;
      font-size: 12px;
      letter-spacing: 2px;
    }
  </style>
</head>
<body>
  <canvas id="bg"></canvas>
  <p class="label">@ayoola/grain-canvas — default config</p>
  <script type="module">
    import { init } from '../src/index.js'
    const destroy = init(document.getElementById('bg'))

    // Example: destroy after 30s to verify cleanup
    // setTimeout(destroy, 30000)
  </script>
</body>
</html>
```

- [ ] **Step 2: Serve and visually verify**

```bash
npm run demo
```

Open `http://localhost:3000/demo/index.html` in a browser.

**Check:**
- Dark background fills the viewport
- Particles float and connect with lines
- Moving the mouse attracts particles toward the cursor
- Grain texture animates (subtle film grain)
- Vignette darkens edges
- On mobile/touch: tapping attracts particles, releasing resets to center
- Switching tabs and returning: animation pauses and resumes

- [ ] **Step 3: Commit**

```bash
git add demo/index.html
git commit -m "feat: add demo page for visual verification"
```

---

## Task 8: Write README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

````markdown
# @ayoola/grain-canvas

Animated film grain + floating particle system as a canvas background. Zero dependencies. Fully configurable. Works anywhere.

**[Live demo](https://ayoolamorakinyo.com)** — seen on my portfolio site.

---

## Install

```bash
npm install @ayoola/grain-canvas
```

## Usage

```html
<canvas id="bg"></canvas>
```

```css
#bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

```js
import { init } from '@ayoola/grain-canvas'

const destroy = init(document.getElementById('bg'))

// Later, to clean up:
destroy()
```

The canvas must have non-zero CSS dimensions before calling `init`. If it's 0×0, a console warning is emitted and the effect will start once the canvas is resized.

---

## Config

All options are optional. The defaults below produce the effect shown in the demo.

```js
import { init, defaults } from '@ayoola/grain-canvas'

const destroy = init(canvas, {
  accentRatio: 0.4,
  backgroundColor: '#050505',
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backgroundColor` | `string` | `'#080808'` | Canvas fill color. Use near-black for grain to look right. |
| `particleCount` | `number` | `90` | Number of particles. Clamped 1–500. |
| `particleSizeMin` | `number` | `0.8` | Minimum particle radius (px). |
| `particleSizeMax` | `number` | `2.8` | Maximum particle radius (px). |
| `particleBaseColor` | `string` | `'rgba(255,255,255,0.55)'` | Color of standard particles. |
| `particleAccentColor` | `string` | `'rgba(255,215,0,0.75)'` | Color of accent particles. |
| `accentRatio` | `number` | `0.25` | Fraction of particles using accent color. Clamped 0–1. |
| `mouseAttractionRadius` | `number` | `200` | Cursor attraction radius (px). |
| `mouseAttractionStrength` | `number` | `0.0008` | Attraction force multiplier. |
| `connectionDistance` | `number` | `110` | Max distance (px) to draw lines between particles. |
| `connectionOpacity` | `number` | `0.25` | Max opacity of connection lines. |
| `glowRadius` | `number` | `140` | Radius of cursor/tap glow (px). |
| `glowColor` | `string` | `'rgba(255,215,0,0.07)'` | Color of cursor/tap glow. |
| `grainOpacity` | `number` | `0.35` | Grain overlay opacity. Clamped 0–1. |
| `grainSwapInterval` | `number` | `50` | Milliseconds between grain frame swaps. Minimum 33ms. |
| `vignetteOpacity` | `number` | `0.6` | Edge vignette darkness. Clamped 0–1. |

Color strings are passed directly to the Canvas 2D API — invalid values render as transparent.

---

## Mobile

Mobile behaviour is automatic and not configurable:

- Grain renders at half resolution with 3 frames instead of 6 for performance
- Tapping attracts particles (same as cursor on desktop)
- Releasing your finger resets the attraction point to the canvas center
- The animation loop pauses automatically when the tab is hidden

---

## Known limitations

- **Grain uses `screen` blend mode** — designed for dark backgrounds. Light `backgroundColor` values will look washed out.
- **Color strings are not validated** — invalid CSS colors render as transparent, matching browser canvas behavior.
- **`0.x.y` is unstable** — per semver convention, minor versions may include breaking changes until `1.0.0`.

---

## React

```jsx
import { useEffect, useRef } from 'react'
import { init } from '@ayoola/grain-canvas'

export function GrainBackground({ options }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const destroy = init(canvasRef.current, options)
    return destroy
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
    />
  )
}
```

---

## Cleanup

`init` returns a `destroy` function. Call it to cancel the animation loop and remove all event listeners. Safe to call more than once. The canvas is not cleared — the last painted frame stays visible.

```js
const destroy = init(canvas)
// ...
destroy() // stops the effect
destroy() // no-op, safe
```

---

## License

MIT
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: write README with usage, config table, React example"
```

---

## Task 9: Create GitHub repo and publish to npm

**Files:**
- No new files

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create grain-canvas --public --source=. --remote=origin --push
```

Expected: repo created at `https://github.com/ayo0la/grain-canvas`

- [ ] **Step 2: Confirm npm authentication**

```bash
npm whoami
```

Expected: your npm username. If you get "Not logged in", run `npm login` and complete the auth flow before continuing.

- [ ] **Step 3: Verify build is clean before publish**

```bash
npm run build
ls dist/
```

Expected: `index.cjs.js  index.d.ts  index.esm.js`

- [ ] **Step 4: Publish to npm**

```bash
npm publish --access public
```

Expected:
```
npm notice Publishing to https://registry.npmjs.org/ with tag latest and public access
+ @ayoola/grain-canvas@0.1.0
```

- [ ] **Step 5: Verify on npm**

Visit `https://www.npmjs.com/package/@ayoola/grain-canvas` and confirm:
- Package page shows `0.1.0`
- README renders correctly
- Weekly downloads counter is visible

- [ ] **Step 6: Verify the demo still works post-publish**

```bash
npm run demo
```

Open `http://localhost:3000/demo/index.html`. This is the authoritative functional verification — the package is browser-only so Node.js `require` testing is not appropriate.

---

## Task 10: Add to portfolio

**Files:**
- Modify: `/Users/ayoola/Desktop/portfolio/index.html`

- [ ] **Step 1: Update the Boot Scraper project card to link to the npm package**

In `/Users/ayoola/Desktop/portfolio/index.html`, find the Boot Scraper project card and add a card for the npm package. Add it to the projects grid:

```html
<a class="project-card" href="https://www.npmjs.com/package/@ayoola/grain-canvas" target="_blank" rel="noopener">
  <span class="proj-tag">OPEN SOURCE · 2026</span>
  <h3 class="proj-name">grain-canvas</h3>
  <p class="proj-desc">Animated film grain and particle system as a zero-dependency canvas background. Extracted from this portfolio and published to npm.</p>
  <span class="proj-arrow">→</span>
</a>
```

- [ ] **Step 2: Commit and push portfolio**

```bash
cd /Users/ayoola/Desktop/portfolio
git add index.html
git commit -m "feat: add grain-canvas npm package to projects"
git push
```
