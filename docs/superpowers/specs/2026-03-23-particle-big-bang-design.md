# Spec: Particle Collection Big Bang

**Date:** 2026-03-23
**Project:** ayoola-portfolio (`/Users/ayoola/Desktop/portfolio`)
**Status:** Approved

---

## Overview

Add an easter egg interaction to the existing grain+particle canvas background. Visitors who collect all 90 particles into a single ball by holding their cursor still, then place the ball over one of two target zones, trigger a cinematic Big Bang explosion. After the explosion, the particles scatter and the loop restarts.

---

## State Machine

Four states cycle continuously:

```
DRIFT → BALL_FORMED → EXPLODING → DRIFT → ...
```

| State | Description |
|---|---|
| `DRIFT` | Default behavior — particles float freely, attracted to cursor within 200px. Unchanged from current code. |
| `BALL_FORMED` | All 90 particles within 100px of cursor. Ball pulses with gold glow. Target zones become visible. |
| `EXPLODING` | Triggered on cursor hover over a target zone. Big Bang animation plays (~1.2s). No interaction accepted. |
| `DRIFT` | Particles flung to random positions, resume normal drift. Loop restarts. |

---

## Ball Detection

- **Threshold:** All 90 particles within **100px** of the current cursor position.
- **Mechanic:** No changes to the existing attraction system. Players keep their cursor still; particles naturally drift in via the existing `f * 0.0008` force. Particles wrap around screen edges so no particle is permanently unreachable.
- **Visual cue:** Once `BALL_FORMED`, the cluster emits a steady gold radial glow pulse (~1s period) so the player knows the ball is formed and ready to place.

---

## Target Zones

Two valid placement targets, both calculated live from the DOM each frame (handles scroll/resize):

### 1. The "I" in MORAKINYO
- `index.html`: Wrap the "I" character in `<span id="name-i">I</span>` inside the `<h1 class="hero-name">` element.
- Position: `getBoundingClientRect()` center of `#name-i`.
- Hover activation radius: **30px**.

### 2. Spinning Logo Center
- Position: center of `#logo-canvas` via `getBoundingClientRect()`.
- Hover activation radius: **50px**.

**Target zone indicator:** Once `BALL_FORMED`, draw a faint pulsing gold ring around each target zone on the `#bg` canvas so the player knows where to go. Rings fade in over ~300ms.

---

## Big Bang Explosion (Cinematic)

Triggered the moment the cursor (with `BALL_FORMED` state) enters a target zone's activation radius.

### Sequence (~1.2s total)

| Time | Effect |
|---|---|
| 0ms | State → `EXPLODING`. All particles given random high-velocity kick (`vx/vy` = random ±15–25). |
| 0–80ms | Blinding white radial flash expands from target point to fill screen. Peaks at ~0.9 opacity. |
| 80–500ms | 3 gold shockwave rings expand from target point to screen edges, opacity fading from 0.8 → 0 as they grow. |
| 0–600ms | Each particle draws a short motion trail (line from previous position), fading as velocity drops. |
| 400ms | Flash begins fading. Trails disappear as particles slow via normal 0.98 damping. |
| 1200ms | Animation complete. State → `DRIFT`. Particles resume normal behavior from their scattered positions. |

### Rendering details
- Flash: `ctx.createRadialGradient` centered on target point, white core → transparent, drawn with `globalAlpha` animated over time.
- Rings: `ctx.arc` strokes with increasing radius and decreasing opacity per frame.
- Trails: each particle stores `prevX / prevY`; during `EXPLODING`, draw a line from `(prevX, prevY)` to `(x, y)` with opacity proportional to speed.

---

## Files Changed

| File | Change |
|---|---|
| `src/canvas/BackgroundCanvas.js` | Add state machine, `checkBallFormed()`, `getTargetZones()`, `triggerExplosion()`, `renderExplosion()`, `renderTargetZones()`, `renderBallGlow()` |
| `index.html` | Wrap "I" in `<span id="name-i">I</span>` |

No new files. All canvas logic stays in `BackgroundCanvas.js`.

---

## Out of Scope

- No reward message or text overlay.
- No sound.
- No changes to the grain layer, vignette, or cursor behavior.
- No changes to the attraction mechanic.
