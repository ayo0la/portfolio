# Spec: Particle Collection Big Bang

**Date:** 2026-03-23
**Project:** ayoola-portfolio (`/Users/ayoola/Desktop/portfolio`)
**Status:** Approved

---

## Overview

Add an easter egg interaction to the existing grain+particle canvas background. Visitors who herd all 90 particles into a single ball by moving and holding their cursor, then hover the ball over one of two target zones, trigger a cinematic Big Bang explosion. After the explosion, the particles scatter and the loop restarts. **Desktop-only** — touch devices have no hover and the feature is silently skipped on touch-only devices (`isTouch === true`).

---

## State Machine

Four states cycle continuously:

```
DRIFT → BALL_FORMED → EXPLODING → DRIFT → ...
```

| State | Description |
|---|---|
| `DRIFT` | Default behavior — particles float freely, attracted to cursor within 200px. Unchanged from current code. |
| `BALL_FORMED` | All 90 particles within 100px of cursor. Ball pulses with gold glow. Target zones fade in. State is re-evaluated every frame — if any particle exceeds 100px from cursor, state immediately reverts to `DRIFT`. |
| `EXPLODING` | Triggered on cursor hover over a target zone while in `BALL_FORMED`. Big Bang animation plays (~1.2s). No state re-evaluation during this phase. |
| `DRIFT` | On explosion completion, all particles receive random high-velocity kicks and state returns to `DRIFT`. |

---

## Ball Detection & Collection Mechanic

### Physics reality
The existing attraction force (`f * 0.0008`, 200px range, 0.98 damping) only acts on particles within 200px of the cursor. Particles further away receive zero force and will not drift in on their own.

### How collection works
The player must **move their cursor around the canvas** to bring all particles within the 200px attraction radius, one group at a time. As particles enter the zone they accelerate toward the cursor and cluster. Once the cursor holds still with all 90 within 100px simultaneously, `BALL_FORMED` triggers. This is the intended play mechanic — herding, not passive waiting.

**No changes to the attraction system.** The 200px range and `f * 0.0008` force remain exactly as-is.

### Threshold
- **100px** from cursor position (not centroid) — re-checked every frame.
- If any single particle exceeds 100px, state reverts to `DRIFT` immediately (no debounce).

---

## Target Zones

Two valid placement targets. Positions are recalculated every frame using `getBoundingClientRect()`. Target zones are only rendered and active when their corresponding DOM element is within the viewport (i.e., `rect.top < window.innerHeight && rect.bottom > 0`).

### 1. The "I" in MORAKINYO
- **HTML change:** Wrap the "I" character in `index.html` line 26: `<span id="name-i">I</span>` inside `<h1 class="hero-name">AYOOLA<br>MORAK<span id="name-i">I</span>NYO</h1>`.
- **Position:** center of `#name-i` via `getBoundingClientRect()`.
- **Hover activation radius:** 30px.

### 2. Spinning Logo Center
- **Position:** center of `#logo-canvas` via `getBoundingClientRect()`.
- **Hover activation radius:** 50px.

### Target zone indicator
Once `BALL_FORMED`, draw a pulsing gold ring around each visible target zone directly on the `#bg` canvas. Rings fade in over 300ms from the moment `BALL_FORMED` is entered (tracked via `ballFormedAt = timestamp`). Ring opacity: `Math.min((timestamp - ballFormedAt) / 300, 1) * 0.6`. Ring animates with a slow pulse: `lineWidth = 1 + Math.sin(timestamp / 400) * 0.5`. Drawn as a `ctx.arc` stroke in gold (`#ffd700`).

---

## Big Bang Explosion (Cinematic)

### Trigger
State transitions from `BALL_FORMED` to `EXPLODING` on the first frame the cursor is within a target zone's activation radius. Record `explosionStartTime = timestamp` and `explosionOrigin = {x, y}` (the target zone center) at this moment. All timing below uses `elapsed = timestamp - explosionStartTime`.

### Sequence

| elapsed | Effect |
|---|---|
| 0ms | All 90 particles given random velocity kick: `vx = (Math.random() - 0.5) * 50`, `vy = (Math.random() - 0.5) * 50`. Normal 0.98 damping continues from this point. |
| 0–80ms | White radial flash expands from `explosionOrigin`. Flash opacity: `Math.max(0, 1 - elapsed / 80) * 0.9`. Drawn as `ctx.createRadialGradient` white core → transparent, radius growing from 0 to `Math.max(W, H)`. |
| 0–600ms | 3 gold shockwave rings, staggered 150ms apart (launch at 0ms, 150ms, 300ms). Each ring: radius grows from 0 to `Math.max(W, H) * 0.8` over 600ms; opacity fades from 0.8 → 0 linearly over its 600ms lifetime. Drawn as `ctx.arc` stroke, `lineWidth = 2`, color `rgba(255,215,0,α)`. |
| 0–600ms | Motion trails: each particle draws a line from `(prevX, prevY)` to `(x, y)`. `prevX/prevY` updated every frame. Trail color matches particle color (gold or white). `lineWidth = 1.5`. Trail opacity: `Math.min(speed / 25, 1) * 0.6` where `speed = Math.sqrt(vx*vx + vy*vy)`. Trails disappear naturally as velocity drops below perceptible speed. |
| 1200ms | `elapsed >= 1200` → state returns to `DRIFT`. No explicit particle reset needed — particles are already scattered by their velocity kicks. |

### Render order
Explosion effects are rendered **after particles but before grain and vignette** — i.e., inserted between the particle loop and the existing grain draw call in `updateBackgroundCanvas`. This means grain overlays the flash (subtly textured look) and the vignette darkens the edges of the explosion naturally.

---

## Ball Glow (BALL_FORMED state)

Rendered each frame while in `BALL_FORMED`, **before particles** in the draw order (so particles render on top):

- **Center:** cursor position (`mx`, `my`)
- **Radius:** 120px
- **Gradient:** `createRadialGradient(mx, my, 0, mx, my, 120)` — `rgba(255,215,0,α)` at center → transparent at edge
- **Pulse:** `α = (Math.sin(timestamp / 500) * 0.5 + 0.5) * 0.15` — oscillates between 0 and 0.15 opacity, period ~3.1s

---

## Files Changed

| File | Change |
|---|---|
| `src/canvas/BackgroundCanvas.js` | State machine variables + `checkBallFormed()` + `getTargetZones()` + `renderBallGlow()` + `renderTargetZones()` + `renderExplosion()` + integrate into `updateBackgroundCanvas()` |
| `index.html` | Wrap "I" in `<span id="name-i">I</span>` |

No new files. All canvas logic stays in `BackgroundCanvas.js`.

---

## Out of Scope

- No reward message or text overlay.
- No sound.
- No changes to the grain layer, vignette, or cursor behavior.
- No changes to the attraction mechanic (200px range, force, damping).
- Touch devices: feature silently disabled (`isTouch` check at init).
