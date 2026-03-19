# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing Three.js stadium/car experience with a dark, cinematic personal brand website for Ayoola Morakinyo — five scrollable sections, ambient canvas background (grain + particles), a rotating 3D personal logo, and GSAP scroll animations.

**Architecture:** Single `index.html` with five `<section>` elements and a `<canvas id="bg">` for the fixed background. A Canvas 2D module drives grain + particles. A separate Three.js `<canvas id="logo-canvas">` renders the personal logo in the hero. GSAP ScrollTrigger drives entrance animations; Lenis provides smooth scroll. All JS is Vanilla ES modules. The entire existing `src/` is replaced.

**Tech Stack:** Three.js (hero logo only), Canvas 2D (background), GSAP + ScrollTrigger, Lenis, Bebas Neue (Google Fonts), Vite, Vanilla JS

**Spec:** `docs/superpowers/specs/2026-03-18-portfolio-redesign.md`

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `index.html` | Replace | Single page markup, all 5 sections, `<canvas id="bg">`, font link, meta tags |
| `src/style.css` | Create | CSS variables, global reset, all section layouts |
| `src/main.js` | Replace | Init all modules, rAF loop |
| `src/canvas/BackgroundCanvas.js` | Create | Grain + particle canvas (fixed, behind everything) |
| `src/hero/HeroLogo.js` | Create | Three.js personal logo in hero |
| `src/cursor/Cursor.js` | Create | Custom circle cursor (desktop only) |
| `src/scroll/SmoothScroll.js` | Create | Lenis init + GSAP ticker wiring |
| `src/scroll/Animations.js` | Create | All GSAP ScrollTrigger setups |
| `src/sections/hero.js` | Create | Hero section init stub |
| `src/sections/about.js` | Create | About section init stub |
| `src/sections/mdfld.js` | Create | MDFLD section init stub |
| `src/sections/projects.js` | Create | Project card hover logic |
| `src/sections/contact.js` | Create | Contact section init stub |
| `package.json` | Modify | Add gsap, lenis; remove rapier |
| `vite.config.js` | Replace | Remove rapier config |
| `src/api/`, `src/audio/`, `src/controls/`, `src/data/`, `src/npcs/`, `src/physics/`, `src/scene/`, `src/ui/`, `src/utils/`, `src/zones/` | Delete | All old stadium code |

---

## Task 1: Clean Slate — Remove Old Code, Install New Deps

**Files:**
- Delete: all old `src/` directories
- Modify: `package.json`
- Replace: `vite.config.js`

- [ ] **Step 1: Remove all old source directories**

```bash
cd /Users/ayoola/Desktop/portfolio
rm -rf src/api src/audio src/controls src/data src/npcs src/physics src/scene src/ui src/utils src/zones
```

- [ ] **Step 2: Verify only main.js remains in src/**

```bash
ls src/
```
Expected: only `main.js` (and possibly `.DS_Store`)

- [ ] **Step 3: Install new dependencies**

```bash
npm install gsap lenis
```

- [ ] **Step 4: Uninstall Rapier**

```bash
npm uninstall @dimforge/rapier3d-compat
```

- [ ] **Step 5: Replace vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
  }
})
```

- [ ] **Step 6: Verify dev server starts without crash**

```bash
npm run dev
```
Expected: Vite dev server starts on `http://localhost:5173` with no terminal errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old stadium code, install gsap and lenis"
```

---

## Task 2: Foundation — index.html + style.css

**Files:**
- Replace: `index.html`
- Create: `src/style.css`
- Replace: `src/main.js` (minimal stub)

- [ ] **Step 1: Write new index.html**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ayoola Morakinyo — Founder &amp; Builder</title>
  <meta name="description" content="Ayoola Morakinyo — Founder of MDFLD, software engineer, building tools for the football industry." />
  <meta property="og:title" content="Ayoola Morakinyo" />
  <meta property="og:description" content="Founder of MDFLD. Builder. Atlanta." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>

  <!-- Background canvas (fixed, z-index -1) -->
  <canvas id="bg"></canvas>

  <!-- §1 Hero -->
  <section id="hero">
    <div class="hero-inner">
      <div class="hero-text">
        <h1 class="hero-name">AYOOLA<br>MORAKINYO</h1>
        <p class="hero-sub">FOUNDER · BUILDER · ATLANTA</p>
        <div class="scroll-indicator">
          <span class="scroll-arrow">↓</span>
        </div>
      </div>
      <div class="hero-logo-wrap">
        <canvas id="logo-canvas"></canvas>
      </div>
    </div>
  </section>

  <!-- §2 About -->
  <section id="about">
    <div class="section-inner about-grid">
      <div class="about-left">
        <span class="mono-tag">// WHO I AM</span>
        <h2 class="about-headline">Founder.<br>Builder.<br>Visionary.</h2>
      </div>
      <div class="about-right">
        <p class="body-copy">Ayoola Morakinyo is a founder and software engineer building tools for the football industry. He is the creator of MDFLD, an AI-powered authentication platform. He works at the intersection of machine learning, product design, and sport.</p>
        <div class="skill-chips">
          <span class="chip">Python</span>
          <span class="chip">Next.js</span>
          <span class="chip">Three.js</span>
          <span class="chip">ML</span>
          <span class="chip">Node.js</span>
        </div>
      </div>
    </div>
  </section>

  <!-- §3 MDFLD -->
  <section id="mdfld">
    <div class="section-inner mdfld-inner">
      <div class="mdfld-topbar">
        <span class="mdfld-badge">MDFLD</span>
        <span class="mono-tag">FLAGSHIP PROJECT</span>
      </div>
      <h2 class="mdfld-headline">Football<br>Authentication<br>Platform</h2>
      <p class="body-copy mdfld-desc">MDFLD is building the trust layer the football industry is missing — AI-powered verification that tells you instantly whether a product is authentic. Currently in beta with 500+ users on the waitlist.</p>
      <a class="mdfld-cta" href="https://beta.mdfld.co" target="_blank" rel="noopener">VIEW PROJECT →</a>
      <div class="mdfld-bg-word" aria-hidden="true">MDFLD</div>
    </div>
  </section>

  <!-- §4 Projects -->
  <section id="projects">
    <div class="section-inner">
      <span class="mono-tag section-tag">// OTHER WORK</span>
      <div class="projects-grid">
        <a class="project-card" href="#" target="_blank" rel="noopener">
          <span class="proj-tag">FULL-STACK · 2025</span>
          <h3 class="proj-name">Allstar Kids Academy</h3>
          <p class="proj-desc">Family portal and digital enrollment system for a childcare business. Replacing paper forms with a real product.</p>
          <span class="proj-arrow">→</span>
        </a>
        <a class="project-card" href="#" target="_blank" rel="noopener">
          <span class="proj-tag">DATA · 2025</span>
          <h3 class="proj-name">Boot Scraper</h3>
          <p class="proj-desc">Multi-site scraper collecting training images across rareboots, bootroom, and thebootchamber for the MDFLD authentication model.</p>
          <span class="proj-arrow">→</span>
        </a>
      </div>
    </div>
  </section>

  <!-- §5 Contact -->
  <section id="contact">
    <div class="section-inner contact-inner">
      <h2 class="contact-heading">Let's talk.</h2>
      <nav class="contact-links">
        <a href="mailto:hello@mdfld.co">EMAIL</a>
        <a href="https://linkedin.com/in/ayoolamorakinyo" target="_blank" rel="noopener">LINKEDIN</a>
        <a href="https://github.com/ayoolamorakinyo" target="_blank" rel="noopener">GITHUB</a>
        <a href="https://twitter.com/mdfld_co" target="_blank" rel="noopener">TWITTER</a>
      </nav>
    </div>
  </section>

  <!-- Custom cursor (desktop only) -->
  <div id="cursor" aria-hidden="true"></div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write src/style.css**

```css
/* src/style.css */

/* ── Reset + Variables ───────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:          #080808;
  --surface:     #0f0f0f;
  --text:        #ffffff;
  --text-muted:  rgba(255,255,255,0.55);
  --gold:        #ffd700;
  --border:      rgba(255,255,255,0.07);
  --font-display: 'Bebas Neue', sans-serif;
  --font-mono:   'Courier New', monospace;
  --font-body:   system-ui, -apple-system, sans-serif;
}

html { scroll-behavior: auto; /* Lenis handles smooth scroll */ }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  overflow-x: hidden;
}

/* ── Background canvas ───────────────────────────────────── */
#bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

/* ── Custom cursor (desktop only) ────────────────────────── */
@media (hover: hover) {
  body { cursor: none; }
}

#cursor {
  display: none;
  position: fixed;
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.6);
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  transition: width 0.15s ease, height 0.15s ease,
              border-color 0.15s ease, background 0.15s ease;
}

@media (hover: hover) {
  #cursor { display: block; }
}

#cursor.hover {
  width: 36px; height: 36px;
  border-color: var(--gold);
  background: rgba(255,215,0,0.06);
}

#cursor.clicking {
  width: 12px; height: 12px;
}

/* ── Shared section layout ───────────────────────────────── */
section {
  min-height: 100vh;
  position: relative;
}

.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(4rem, 8vw, 8rem) clamp(1.5rem, 6vw, 6rem);
}

/* ── Shared typography helpers ───────────────────────────── */
.mono-tag {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.body-copy {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-muted);
}

/* ── §1 Hero ─────────────────────────────────────────────── */
#hero {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-inner {
  display: flex;
  align-items: center;
  gap: 4rem;
  max-width: 1200px;
  width: 100%;
  padding: clamp(1.5rem, 6vw, 6rem);
}

.hero-text { flex: 0 0 60%; }

.hero-name {
  font-family: var(--font-display);
  font-size: clamp(4rem, 10vw, 9rem);
  letter-spacing: 2px;
  line-height: 0.92;
  color: var(--text);
}

.hero-sub {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 5px;
  color: var(--text-muted);
  margin-top: 1.5rem;
  text-transform: uppercase;
}

.scroll-indicator { margin-top: 3rem; }

.scroll-arrow {
  font-family: var(--font-mono);
  font-size: 1.2rem;
  color: rgba(255,255,255,0.3);
  display: inline-block;
  animation: bounce 1.6s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(8px); }
}

.hero-logo-wrap {
  flex: 0 0 40%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#logo-canvas {
  display: block;
  width: 220px;
  height: 220px;
}

/* ── §2 About ────────────────────────────────────────────── */
#about { background: var(--bg); }

.about-grid {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 4rem;
  align-items: start;
}

.about-headline {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 4.5rem);
  letter-spacing: 1px;
  line-height: 1.1;
  color: var(--text);
}

/* Word spans injected by Animations.js for stagger */
.about-headline .word {
  display: inline-block;
}

.about-right {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 3rem;
}

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px;
}

/* ── §3 MDFLD ────────────────────────────────────────────── */
#mdfld { background: #050505; }

.mdfld-inner {
  position: relative;
  overflow: hidden;
}

.mdfld-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

.mdfld-badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 5px;
  font-weight: 700;
  color: var(--gold);
  border: 1px solid rgba(255,215,0,0.3);
  padding: 4px 12px;
  border-radius: 2px;
}

.mdfld-headline {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  letter-spacing: 1px;
  line-height: 1.0;
  color: var(--text);
  max-width: 600px;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

/* Line spans injected by Animations.js for stagger */
.mdfld-headline .line {
  display: block;
}

.mdfld-desc {
  max-width: 560px;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
}

.mdfld-cta {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: var(--gold);
  text-decoration: none;
  font-weight: 700;
  position: relative;
  z-index: 1;
  transition: opacity 0.2s;
}
.mdfld-cta:hover { opacity: 0.7; }

.mdfld-bg-word {
  position: absolute;
  font-family: var(--font-display);
  font-size: clamp(8rem, 20vw, 18rem);
  color: rgba(255,215,0,0.04);
  bottom: -1rem;
  right: -1rem;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

/* ── §4 Projects ─────────────────────────────────────────── */
#projects { background: var(--bg); }

.section-tag { margin-bottom: 3rem; }

.projects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.project-card {
  display: block;
  text-decoration: none;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1.75rem;
  background: rgba(255,255,255,0.02);
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}

.project-card:hover {
  border-color: var(--gold);
  box-shadow: 0 0 24px rgba(255,215,0,0.06);
}

.proj-tag {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.5rem;
  letter-spacing: 2px;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.proj-name {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
}

.proj-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.proj-arrow {
  position: absolute;
  bottom: 1.5rem;
  right: 1.75rem;
  font-size: 1rem;
  color: var(--gold);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.project-card:hover .proj-arrow {
  opacity: 1;
  transform: translateX(4px);
}

/* ── §5 Contact ──────────────────────────────────────────── */
/* Note: #050505 bg — --text-muted (rgba 255,255,255,0.55) passes WCAG AA here too */
#contact {
  background: #050505;
  display: flex;
  align-items: center;
}

.contact-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
}

.contact-heading {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 5rem);
  letter-spacing: 1px;
  color: var(--text);
}

.contact-links {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.contact-links a {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 3px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.contact-links a:hover { color: var(--gold); }

/* ── Responsive (mobile < 768px) ────────────────────────── */
@media (max-width: 767px) {
  .hero-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 2rem;
  }
  .hero-text { flex: none; width: 100%; }
  .hero-logo-wrap { flex: none; width: 100%; justify-content: center; }
  #logo-canvas { width: 120px; height: 120px; }

  .about-grid { grid-template-columns: 1fr; gap: 2rem; }
  .about-right { padding-top: 0; }

  .projects-grid { grid-template-columns: 1fr; }

  .contact-inner { flex-direction: column; align-items: flex-start; }
}
```

- [ ] **Step 3: Write minimal src/main.js stub**

```js
// src/main.js
import './style.css'
console.log('portfolio init')
```

- [ ] **Step 4: Open browser and verify layout**

Run `npm run dev`, open the URL. Expected: all five sections visible, dark background, Bebas Neue font loading, gold accents, correct two-column layouts on desktop. No JS functionality yet — scroll, layouts, and CSS hover states only.

- [ ] **Step 5: Commit**

```bash
git add index.html src/style.css src/main.js vite.config.js
git commit -m "feat: scaffold index.html and style.css for all five sections"
```

---

## Task 3: Background Canvas (Grain + Particles)

**Files:**
- Create: `src/canvas/BackgroundCanvas.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create src/canvas/BackgroundCanvas.js**

```js
// src/canvas/BackgroundCanvas.js

let canvas, ctx, W, H
let mx = 0, my = 0
let grainFrames = []
let grainIndex = 0
let lastGrainSwap = 0
let particles = []
let isTouch = false

const PARTICLE_COUNT  = 90
const GRAIN_FRAMES    = 6

function buildGrainFrames() {
  grainFrames = []
  for (let i = 0; i < GRAIN_FRAMES; i++) {
    const off = document.createElement('canvas')
    off.width  = W
    off.height = H
    const c  = off.getContext('2d')
    const id = c.createImageData(W, H)
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
  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    vx:   (Math.random() - 0.5) * 0.5,
    vy:   (Math.random() - 0.5) * 0.5,
    r:    Math.random() * 2 + 0.8,
    gold: Math.random() < 0.25,
  }))
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

  if (!isTouch) {
    mx = W / 2
    my = H / 2
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })
  }

  window.addEventListener('resize', onResize)
}

export function updateBackgroundCanvas(timestamp) {
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, W, H)

  // ── Particles ──────────────────────────────────────────────
  for (const p of particles) {
    if (!isTouch) {
      const dx = mx - p.x
      const dy = my - p.y
      const d  = Math.sqrt(dx * dx + dy * dy)
      if (d < 200) {
        const f = (200 - d) / 200
        p.vx += dx * f * 0.0008
        p.vy += dy * f * 0.0008
      }
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

  // Cursor glow (desktop only)
  if (!isTouch) {
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, 140)
    g.addColorStop(0, 'rgba(255,215,0,0.07)')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
  }

  // ── Grain ──────────────────────────────────────────────────
  if (timestamp - lastGrainSwap > 50) {
    grainIndex    = (grainIndex + 1) % GRAIN_FRAMES
    lastGrainSwap = timestamp
  }
  if (grainFrames[grainIndex]) {
    ctx.globalAlpha = 0.35
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(grainFrames[grainIndex], 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  // ── Vignette ───────────────────────────────────────────────
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.85)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
}
```

- [ ] **Step 2: Update src/main.js**

```js
// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'

initBackgroundCanvas()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

- [ ] **Step 3: Verify in browser**

Expected: dark background with animated particles drifting. 25% gold dots, 75% white. Connection lines between nearby particles. Moving mouse on desktop attracts particles. Grain texture animated on top. Vignette darkens edges. Canvas fills entire viewport including when scrolling.

- [ ] **Step 4: Commit**

```bash
git add src/canvas/BackgroundCanvas.js src/main.js
git commit -m "feat: add background canvas with grain and particle system"
```

---

## Task 4: Custom Cursor

**Files:**
- Create: `src/cursor/Cursor.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create src/cursor/Cursor.js**

```js
// src/cursor/Cursor.js

let el = null

export function initCursor() {
  if (!window.matchMedia('(hover: hover)').matches) return

  el = document.getElementById('cursor')
  if (!el) return

  window.addEventListener('mousemove', e => {
    el.style.left = e.clientX + 'px'
    el.style.top  = e.clientY + 'px'
  })

  // Hover state on all interactive elements
  document.querySelectorAll('a, button, [role="button"]').forEach(node => {
    node.addEventListener('mouseenter', () => el.classList.add('hover'))
    node.addEventListener('mouseleave', () => el.classList.remove('hover'))
  })

  // Click flash — auto-removes after 100ms (not on mouseup, which would linger on long press)
  window.addEventListener('mousedown', () => {
    el.classList.add('clicking')
    setTimeout(() => el.classList.remove('clicking'), 100)
  })
}
```

- [ ] **Step 2: Update src/main.js**

```js
// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor } from './cursor/Cursor.js'

initBackgroundCanvas()
initCursor()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

- [ ] **Step 3: Verify in browser**

Desktop: circle cursor follows mouse with CSS lag. Expands to 36px gold circle over any link. Briefly shrinks to 12px on click and auto-resets (even if mouse button held). Mobile/touch: OS default cursor unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/cursor/Cursor.js src/main.js
git commit -m "feat: add custom circle cursor with hover and 100ms click flash"
```

---

## Task 5: Smooth Scroll + Scroll Animations

**Files:**
- Create: `src/scroll/SmoothScroll.js`
- Create: `src/scroll/Animations.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create src/scroll/SmoothScroll.js**

```js
// src/scroll/SmoothScroll.js
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initSmoothScroll() {
  const lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}
```

- [ ] **Step 2: Create src/scroll/Animations.js**

```js
// src/scroll/Animations.js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initAnimations() {
  // Independent guards — mobile skips all; reduced-motion skips GSAP only
  if (window.innerWidth < 768) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  _animateHero()
  _animateAbout()
  _animateMdfld()
  _animateProjects()
  _animateContact()
}

// ── Hero ──────────────────────────────────────────────────────
function _animateHero() {
  const nameEl = document.querySelector('.hero-name')
  if (!nameEl) return

  // Split by <br> to preserve line breaks, then wrap each char
  const lines = nameEl.innerHTML.split('<br>')
  nameEl.innerHTML = lines.map(line =>
    line.split('').map(ch =>
      `<span class="char" style="display:inline-block">${ch}</span>`
    ).join('')
  ).join('<br>')

  gsap.from('.hero-name .char', {
    opacity: 0,
    y: 20,
    stagger: 0.02,
    duration: 0.5,
    delay: 0.3,
    ease: 'power2.out',
  })

  gsap.from('.hero-sub', {
    opacity: 0,
    y: 10,
    duration: 0.6,
    delay: 0.8,
    ease: 'power2.out',
  })
}

// ── About ─────────────────────────────────────────────────────
function _animateAbout() {
  // Word-stagger on headline: wrap each word in <span class="word">
  const headlineEl = document.querySelector('.about-headline')
  if (headlineEl) {
    const lines = headlineEl.innerHTML.split('<br>')
    headlineEl.innerHTML = lines.map(line =>
      line.split(' ')
        .filter(w => w.length)
        .map(w => `<span class="word" style="display:inline-block">${w}</span>`)
        .join(' ')
    ).join('<br>')
  }

  gsap.from('.about-headline .word', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    x: -40,
    opacity: 0,
    stagger: 0.08,
    duration: 0.7,
    ease: 'power2.out',
  })

  gsap.from('.about-right .body-copy', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    y: 30,
    opacity: 0,
    duration: 0.7,
    delay: 0.15,
    ease: 'power2.out',
  })

  gsap.from('.about-right .skill-chips', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    y: 20,
    opacity: 0,
    duration: 0.6,
    delay: 0.3,
    ease: 'power2.out',
  })
}

// ── MDFLD ─────────────────────────────────────────────────────
function _animateMdfld() {
  // Line-stagger on headline: wrap each <br>-delimited line in <span class="line">
  const headlineEl = document.querySelector('.mdfld-headline')
  if (headlineEl) {
    const lines = headlineEl.innerHTML.split('<br>')
    headlineEl.innerHTML = lines
      .map(line => `<span class="line" style="display:block">${line}</span>`)
      .join('')
  }

  gsap.from('.mdfld-headline .line', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    y: 30,
    opacity: 0,
    stagger: 0.12,
    duration: 0.8,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-bg-word', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    opacity: 0,
    scale: 1.05,
    duration: 1,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-desc', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    y: 20,
    opacity: 0,
    duration: 0.7,
    delay: 0.2,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-cta', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    x: -20,
    opacity: 0,
    duration: 0.6,
    delay: 0.4,
    ease: 'power2.out',
  })
}

// ── Projects ──────────────────────────────────────────────────
function _animateProjects() {
  gsap.from('.project-card', {
    scrollTrigger: { trigger: '#projects', start: 'top 80%' },
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power2.out',
  })
}

// ── Contact ───────────────────────────────────────────────────
function _animateContact() {
  gsap.from('.contact-heading', {
    scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    x: -40,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
  })

  gsap.from('.contact-links', {
    scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
    ease: 'power2.out',
  })
}
```

- [ ] **Step 3: Update src/main.js**

```js
// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor } from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations } from './scroll/Animations.js'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

- [ ] **Step 4: Verify scroll animations on desktop**

Scroll through all sections. Expected:
- Hero: name chars stagger in on load, subline fades up after 0.8s delay
- About: individual words in "Founder. Builder. Visionary." stagger in from left; body copy and chips fade up
- MDFLD: three lines ("Football" / "Authentication" / "Platform") stagger in one by one; bg "MDFLD" word fades up; CTA slides in last
- Projects: two cards stagger up
- Contact: heading slides from left, links fade in
- Smooth inertia on scroll (Lenis)

- [ ] **Step 5: Verify mobile (< 768px)**

Resize to 767px or use Chrome DevTools device toolbar. Expected: all sections fully visible from the start — no entrance animations. Content readable without any interaction.

- [ ] **Step 6: Verify reduced-motion**

In Chrome DevTools → More Tools → Rendering → "Emulate CSS media feature" → select `prefers-reduced-motion: reduce`. Reload. Expected: no GSAP animations, no char/word splits. All content immediately visible.

- [ ] **Step 7: Commit**

```bash
git add src/scroll/SmoothScroll.js src/scroll/Animations.js src/main.js
git commit -m "feat: add Lenis smooth scroll and GSAP scroll animations with word/line stagger"
```

---

## Task 6: Section JS Files

**Files:**
- Create: `src/sections/hero.js`
- Create: `src/sections/about.js`
- Create: `src/sections/mdfld.js`
- Create: `src/sections/projects.js`
- Create: `src/sections/contact.js`
- Modify: `src/main.js`

These modules initialise any section-specific JS behaviour not handled by Animations.js. Currently `hero.js` and `projects.js` have runtime logic; the others are stubs for future use.

- [ ] **Step 1: Create src/sections/hero.js**

```js
// src/sections/hero.js
// Hero section — scroll arrow bounce handled by CSS @keyframes.
// Nothing to initialise at runtime.
export function initHero() {}
```

- [ ] **Step 2: Create src/sections/about.js**

```js
// src/sections/about.js
export function initAbout() {}
```

- [ ] **Step 3: Create src/sections/mdfld.js**

```js
// src/sections/mdfld.js
export function initMdfld() {}
```

- [ ] **Step 4: Create src/sections/projects.js**

```js
// src/sections/projects.js
// CSS transitions handle border/shadow hover states.
// This module is the right place for any future JS card interactions (e.g. modal preview).
export function initProjects() {}
```

- [ ] **Step 5: Create src/sections/contact.js**

```js
// src/sections/contact.js
export function initContact() {}
```

- [ ] **Step 6: Update src/main.js to import all sections**

```js
// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor }       from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations }   from './scroll/Animations.js'
import { initHero }         from './sections/hero.js'
import { initAbout }        from './sections/about.js'
import { initMdfld }        from './sections/mdfld.js'
import { initProjects }     from './sections/projects.js'
import { initContact }      from './sections/contact.js'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()
initHero()
initAbout()
initMdfld()
initProjects()
initContact()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

- [ ] **Step 7: Verify in browser**

No visible change expected. Open DevTools → Console. Expected: zero errors. Site still functions identically to previous step.

- [ ] **Step 8: Commit**

```bash
git add src/sections/hero.js src/sections/about.js src/sections/mdfld.js \
        src/sections/projects.js src/sections/contact.js src/main.js
git commit -m "feat: add section JS modules matching spec file structure"
```

---

## Task 7: Hero 3D Logo

**Files:**
- Create: `src/hero/HeroLogo.js`
- Modify: `src/main.js`

The logo SVG source: `/Users/ayoola/Desktop/hanl/src/components/layout/Footer.tsx` (inline `<svg viewBox="0 0 48 48">`).

Coordinate conversion: `x_3d = (x/24) - 1`, `y_3d = -((y/24) - 1)` (flip Y to match Three.js Y-up convention).

- [ ] **Step 1: Create src/hero/HeroLogo.js**

```js
// src/hero/HeroLogo.js
import * as THREE from 'three'

// ── SVG → Three.js coordinate conversion ────────────────────
// SVG viewBox 0 0 48 48, centre is (24, 24)
// x_3d = (x / 24) - 1
// y_3d = -((y / 24) - 1)   ← flip Y axis
function pt(x, y) {
  return new THREE.Vector3(x / 24 - 1, -((y / 24) - 1), 0)
}

// Outer polygon (from SVG path M...Z)
const OUTLINE = [
  [20, 6], [28, 6], [32, 10], [32, 16], [30, 20], [34, 26],
  [32, 34], [28, 40], [24, 42], [20, 38], [16, 32], [14, 26],
  [16, 20], [14, 14], [16, 10],
]

// Inner node circles (cx, cy from SVG <circle> elements)
const NODES = [
  [24, 13],
  [30, 21],
  [21, 30],
  [17, 20],
]

// Connections between node indices (matching SVG <line> elements)
const EDGES = [
  [0, 1], // (24,13) → (30,21)
  [1, 2], // (30,21) → (21,30)
  [3, 0], // (17,20) → (24,13)
]

function buildGroup() {
  const group = new THREE.Group()

  // Closed polygon outline
  const outlinePts = [
    ...OUTLINE.map(([x, y]) => pt(x, y)),
    pt(...OUTLINE[0]), // close the loop
  ]
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePts),
    new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.65 }),
  ))

  // Inner node spheres
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })
  const nodeVec = NODES.map(([x, y]) => pt(x, y))
  nodeVec.forEach(pos => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      nodeMat,
    )
    mesh.position.copy(pos)
    group.add(mesh)
  })

  // Connection lines between nodes
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.5 })
  EDGES.forEach(([a, b]) => {
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([nodeVec[a].clone(), nodeVec[b].clone()]),
      edgeMat,
    ))
  })

  return group
}

export function initHeroLogo() {
  const canvasEl = document.getElementById('logo-canvas')
  if (!canvasEl) return null

  const isMobile = window.innerWidth < 768
  const SIZE     = isMobile ? 120 : 220

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(SIZE, SIZE)

  const scene  = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.z = 3.5

  const group = buildGroup()
  scene.add(group)

  window.addEventListener('resize', () => {
    const s = window.innerWidth < 768 ? 120 : 220
    renderer.setSize(s, s)
  })

  // animate receives the raw timestamp (ms) from the rAF loop.
  // Using raw timestamp for consistent period regardless of frame rate.
  function animate(ts) {
    const t = ts / 1000 // seconds
    group.rotation.y  = t * 0.4           // full rotation every ~15.7 s
    group.position.y  = Math.sin(t) * 0.08 // float period ~6.3 s
    renderer.render(scene, camera)
  }

  return { animate }
}
```

- [ ] **Step 2: Update src/main.js**

```js
// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor }       from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations }   from './scroll/Animations.js'
import { initHeroLogo }     from './hero/HeroLogo.js'
import { initHero }         from './sections/hero.js'
import { initAbout }        from './sections/about.js'
import { initMdfld }        from './sections/mdfld.js'
import { initProjects }     from './sections/projects.js'
import { initContact }      from './sections/contact.js'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()
initHero()
initAbout()
initMdfld()
initProjects()
initContact()

const heroLogo = initHeroLogo()

function loop(ts) {
  updateBackgroundCanvas(ts)
  heroLogo?.animate(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
```

- [ ] **Step 3: Verify in browser**

In the hero section: gold wireframe polygon rotates smoothly on Y axis (one full rotation every ~15 seconds). 4 gold spheres at key vertices. Blue connection lines between node pairs. Gentle upward/downward float with a ~6-second period. On mobile (< 768px): logo renders at 120×120px, centred below the name.

- [ ] **Step 4: Commit**

```bash
git add src/hero/HeroLogo.js src/main.js
git commit -m "feat: add Three.js personal logo to hero with rotation and float"
```

---

## Task 8: Final Polish — Build, Verify, Commit

**Files:**
- Modify: `package.json` (name update)

- [ ] **Step 1: Update package.json name field**

Change `"name": "mdfld-stadium-portfolio"` to `"name": "ayoola-morakinyo-portfolio"`.

- [ ] **Step 2: Run production build**

```bash
npm run build
```
Expected: exits with code 0, no errors. Output written to `dist/`.

- [ ] **Step 3: Preview production build**

```bash
npm run preview
```
Open the preview URL. Verify canvas, logo, animations all work identically to dev mode.

- [ ] **Step 4: Zero-error check**

Open Chrome DevTools → Console tab. Reload the page. Expected: **zero red errors**. (Yellow warnings from Three.js or Lenis internals are acceptable.)

- [ ] **Step 5: Mobile layout check**

Chrome DevTools → Toggle device toolbar → iPhone 12 Pro (390×844). Expected:
- Single-column layout throughout
- Logo at 120px centred below name
- No custom cursor
- All five sections readable
- Canvas still running

- [ ] **Step 6: Reduced-motion check**

Chrome DevTools → More Tools → Rendering → scroll to "Emulate CSS media feature" → set `prefers-reduced-motion: reduce` → reload. Expected: no entrance animations (chars, words, lines don't split or animate), all content fully visible immediately.

- [ ] **Step 7: Verify MDFLD CTA link**

Click "VIEW PROJECT →". Expected: opens `https://beta.mdfld.co` in new tab.

- [ ] **Step 8: Final commit**

```bash
git add package.json
git commit -m "feat: complete portfolio redesign — cinematic scroll, Three.js logo, Canvas 2D background"
```

---

## Running the Project

```bash
cd /Users/ayoola/Desktop/portfolio
npm run dev      # development server → http://localhost:5173
npm run build    # production build  → dist/
npm run preview  # preview production build
```

---

## Spec Verification Checklist

- [ ] Hero text, canvas, and 3D logo all visible within 2s on Fast 3G (Chrome DevTools → Network throttle)
- [ ] Background canvas renders grain + particles on first paint (visible before any scroll)
- [ ] Personal logo rotates continuously in the hero
- [ ] All five sections present; scroll animations fire on desktop Chrome
- [ ] Custom cursor visible and reactive on desktop; absent on mobile/touch
- [ ] MDFLD CTA links to `https://beta.mdfld.co`
- [ ] Zero console errors on load
- [ ] Page renders correctly on Chrome, Safari, Firefox (desktop)
- [ ] `prefers-reduced-motion: reduce` (DevTools → Rendering) disables all GSAP animations; page fully readable
