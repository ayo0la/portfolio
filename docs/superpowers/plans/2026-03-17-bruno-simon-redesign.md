# Bruno Simon Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the MDFLD stadium portfolio to match Bruno Simon's core UX — physics playground on the pitch, content in 3 in-world billboard zones, world-space speech bubbles replacing the dialogue modal, and an automatic day→night lighting cycle over 5 minutes.

**Architecture:** DayNightCycle.js owns all base lighting as single source of truth; Floodlights.js and Sky.js become pure builders that return refs. Zones reduce from 6 to 3, each with a proximity-fading canvas billboard. NPCs reduce from 4 to 2, each with a Three.js Sprite speech bubble instead of a modal popup. KnockableObjects.js is rewritten with 25 physics objects (footballs, cones, boxes, boots, trophy); static set dressing (flags, adboards, benches) moves to PitchAtmosphere.js.

**Tech Stack:** Three.js 0.172, Rapier 3D 0.19, Vite 6, Vanilla JS ES modules. No test runner — verification is visual (run `npm run dev`, check in browser). Dev server: `cd /Users/ayoola/Desktop/portfolio && npm run dev`.

---

## File Map

| File | Action |
|------|--------|
| `src/utils/Constants.js` | Update — 3 zones, 2 NPC positions, day/night values |
| `src/scene/Floodlights.js` | Update — pure builder, return `{ floodlights, ambientLight, sunLight, hemiLight }`, delete `setMatchDayLights` |
| `src/scene/Sky.js` | Rewrite — return `{ skyUniforms, sunMeshes }` for DayNightCycle to drive |
| `src/scene/DayNightCycle.js` | New — lerp all lighting each frame, export `initDayNight`, `updateDayNight`, `getDayProgress` |
| `src/scene/MatchDayMode.js` | Update — null-guard `#matchday-btn`, replace `setMatchDayLights` with `applyMatchDayBoost` delta |
| `src/scene/PitchAtmosphere.js` | New — static Three.js mesh set dressing (corner flags, adboards, benches) |
| `src/physics/KnockableObjects.js` | Rewrite — 12 footballs, 6 cones, 4 boxes, 2 boots, 1 trophy |
| `src/zones/WhoIAmZone.js` | New (repurpose BuilderTunnel.js) |
| `src/zones/SkillsZone.js` | New |
| `src/zones/ProjectsZone.js` | New (repurpose TheArchive.js) |
| `src/zones/ZoneManager.js` | Update — 3 zones, billboard distance fade, import new zone files |
| `src/zones/MidfieldCircle.js` | Delete |
| `src/zones/BuilderTunnel.js` | Delete (content moved to WhoIAmZone.js) |
| `src/zones/LockerRoom.js` | Delete |
| `src/zones/TransferMarket.js` | Delete |
| `src/zones/ExpansionWing.js` | Delete |
| `src/zones/TheArchive.js` | Delete (content moved to ProjectsZone.js) |
| `src/npcs/SpeechBubble.js` | New — Three.js Sprite canvas texture, streams dialogue |
| `src/npcs/NPCBase.js` | Update — remove label/role sprites, create SpeechBubble in build() |
| `src/npcs/BuilderNPC.js` | New |
| `src/npcs/NPCManager.js` | Update — 2 NPCs, show/hide bubble on proximity |
| `src/npcs/CTOnpc.js` | Delete |
| `src/npcs/InvestorNPC.js` | Delete |
| `src/npcs/CommunityNPC.js` | Delete |
| `src/ui/DialogueModal.js` | Delete |
| `src/ui/HUD.js` | Update — remove zone/prompt bindings |
| `src/data/dialogues.js` | Update — remove cto/investor/community, add builder |
| `src/main.js` | Update — wire DayNightCycle, remove DialogueModal import, add PitchAtmosphere |
| `index.html` | Update — remove modal HTML, matchday button, hud-zone, hud-prompt |

---

## Task 1: Update Constants.js — Foundation

**Files:**
- Modify: `src/utils/Constants.js`

- [ ] **Step 1: Replace ZONES with 3 new zones and update NPC positions**

Open `src/utils/Constants.js`. Replace the entire `ZONES` block and the `NPCS` block:

```js
export const ZONES = {
  whoIAm:   { id: 'whoIAm',   label: 'Who I Am',  position: [0,   0, -45], radius: 18 },
  skills:   { id: 'skills',   label: 'Skills',    position: [-55, 0,   0], radius: 18 },
  projects: { id: 'projects', label: 'Projects',  position: [55,  0,   0], radius: 18 },
}

export const NPCS = {
  ayoola:  { id: 'ayoola',  position: [0, 0, 10], color: 0xffd700, label: 'Ayoola',  role: 'Founder — MDFLD' },
  builder: { id: 'builder', position: [48, 0, 0], color: 0x00e5ff, label: 'Builder', role: 'What We Build' },
}
```

- [ ] **Step 2: Add day/night values to LIGHTS**

In `src/utils/Constants.js`, extend the `LIGHTS` block to add the day start and transition values:

```js
export const LIGHTS = {
  // Night / current values (unchanged)
  AMBIENT_COLOR:            0xffeedd,
  AMBIENT_INTENSITY:        1.2,
  FLOOD_COLOR:              0xfff5e0,
  FLOOD_INTENSITY:          1.8,
  FLOOD_INTENSITY_MATCHDAY: 9.0,
  SUN_COLOR:                0xfff5e0,
  SUN_INTENSITY:            3.8,

  // Day start values
  DAY_AMBIENT_INTENSITY:    2.8,
  DAY_SUN_INTENSITY:        4.5,
  DAY_FLOOD_INTENSITY:      0,
  DAY_FOG_DENSITY:          0.003,
  NIGHT_FOG_DENSITY:        0.0018,
  DAY_NIGHT_DURATION:       300,   // seconds for full transition
}
```

- [ ] **Step 3: Start dev server and confirm no import errors**

```bash
cd /Users/ayoola/Desktop/portfolio && npm run dev
```
Expected: server starts, browser opens, no console errors about missing exports from Constants.js.

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/portfolio
git add src/utils/Constants.js
git commit -m "feat: update constants for 3-zone layout and day/night values"
```

---

## Task 2: Floodlights.js — Pure Builder

**Files:**
- Modify: `src/scene/Floodlights.js`

- [ ] **Step 1: Return sunLight and remove setMatchDayLights**

Replace `src/scene/Floodlights.js` entirely with a version that:
1. Returns `{ floodlights, ambientLight, sunLight, hemiLight }` (add `sunLight` and `hemiLight` to return)
2. Deletes the `setMatchDayLights` export
3. Sets `FLOOD_INTENSITY` to `LIGHTS.DAY_FLOOD_INTENSITY` (0) on init (DayNightCycle will ramp it up)

Key changes — in `buildFloodlights`:
```js
// Change return line from:
return { floodlights, ambientLight }
// To:
return { floodlights, ambientLight, sunLight, hemiLight }
```

And set initial floodlight intensity to day value:
```js
// In buildPylon, change:
const light = new THREE.SpotLight(LIGHTS.FLOOD_COLOR, LIGHTS.FLOOD_INTENSITY)
// To:
const light = new THREE.SpotLight(LIGHTS.FLOOD_COLOR, LIGHTS.DAY_FLOOD_INTENSITY)
```

Delete the entire `export function setMatchDayLights(active)` block (lines 93–103).

- [ ] **Step 2: Verify no runtime crash**

In browser console after `npm run dev`, confirm no "setMatchDayLights is not exported" error (it isn't imported anywhere yet — we'll fix MatchDayMode.js in Task 5).

- [ ] **Step 3: Commit**

```bash
git add src/scene/Floodlights.js
git commit -m "refactor: Floodlights becomes pure builder, expose all light refs"
```

---

## Task 3: Sky.js Rewrite — Return Refs

**Files:**
- Modify: `src/scene/Sky.js`

- [ ] **Step 1: Change buildSky to return skyUniforms and sunMeshes**

Replace `src/scene/Sky.js`. The sky still builds everything identically, but now returns the refs that DayNightCycle needs to animate. Change the function signature and add a return:

```js
export function buildSky(scene) {
  // ... all existing geometry code unchanged ...

  // At the very end, replace the implicit return with:
  return {
    skyUniforms: skyMat.uniforms,   // { topColor, horizonColor, offset, exponent }
    sunMeshes: [sun, innerGlow, halo],  // all three sun disc meshes
  }
}
```

Also set the day start sky colours in the uniforms at creation time (bright blue sky for day):
```js
// Change from current:
topColor:     { value: new THREE.Color(0x1565c0) },
horizonColor: { value: new THREE.Color(0x87ceeb) },
// To day-start values:
topColor:     { value: new THREE.Color(0x4a90d9) },
horizonColor: { value: new THREE.Color(0x87ceeb) },
```

- [ ] **Step 2: Verify sky still renders**

In browser after `npm run dev`: sky gradient should be visible and unchanged visually (it's still static at this point — DayNightCycle drives it later).

- [ ] **Step 3: Commit**

```bash
git add src/scene/Sky.js
git commit -m "refactor: Sky.js returns skyUniforms and sunMeshes for DayNightCycle"
```

---

## Task 4: DayNightCycle.js — New Module

**Files:**
- Create: `src/scene/DayNightCycle.js`

- [ ] **Step 1: Create the module**

Create `src/scene/DayNightCycle.js`:

```js
import * as THREE from 'three'
import { LIGHTS } from '../utils/Constants.js'

let _lights = null   // { ambient, sun, floods[], hemi, skyUniforms, sunMeshes[] }
let _scene  = null
let _dayProgress = 0

const _dayTopColor     = new THREE.Color(0x4a90d9)
const _nightTopColor   = new THREE.Color(0x020510)
const _dayHorizonColor = new THREE.Color(0x87ceeb)
const _nightHorizonColor = new THREE.Color(0x060a14)
const _lerpColor = new THREE.Color()

export function initDayNight(scene, lights) {
  _scene  = scene
  _lights = lights
  _dayProgress = 0

  // Set fog to day start
  scene.fog = new THREE.FogExp2(0x87ceeb, LIGHTS.DAY_FOG_DENSITY)

  // Initialise all lights to day state
  if (_lights.ambient) {
    _lights.ambient.intensity = LIGHTS.DAY_AMBIENT_INTENSITY
  }
  if (_lights.sun) {
    _lights.sun.intensity = LIGHTS.DAY_SUN_INTENSITY
  }
  if (_lights.floods) {
    _lights.floods.forEach(f => { f.intensity = LIGHTS.DAY_FLOOD_INTENSITY })
  }
}

export function updateDayNight(elapsed) {
  if (!_lights) return
  _dayProgress = Math.min(elapsed / LIGHTS.DAY_NIGHT_DURATION, 1)
  const p = _dayProgress

  // Ambient light
  if (_lights.ambient) {
    _lights.ambient.intensity = _lerp(LIGHTS.DAY_AMBIENT_INTENSITY, LIGHTS.AMBIENT_INTENSITY, p)
  }

  // Sun
  if (_lights.sun) {
    _lights.sun.intensity = _lerp(LIGHTS.DAY_SUN_INTENSITY, 0, p)
  }

  // Floodlights
  if (_lights.floods) {
    const floodTarget = _lerp(LIGHTS.DAY_FLOOD_INTENSITY, LIGHTS.FLOOD_INTENSITY, p)
    _lights.floods.forEach(f => { f.intensity = floodTarget })
  }

  // Sky shader uniforms
  if (_lights.skyUniforms) {
    _lerpColor.lerpColors(_dayTopColor, _nightTopColor, p)
    _lights.skyUniforms.topColor.value.copy(_lerpColor)
    _lerpColor.lerpColors(_dayHorizonColor, _nightHorizonColor, p)
    _lights.skyUniforms.horizonColor.value.copy(_lerpColor)
  }

  // Sun disc — fade out by dayProgress 0.6
  if (_lights.sunMeshes) {
    const sunOpacity = Math.max(0, 1 - p / 0.6)
    _lights.sunMeshes.forEach((m, i) => {
      if (m.material) m.material.opacity = i === 0 ? sunOpacity * 0.95
                                         : i === 1 ? sunOpacity * 0.22
                                         : sunOpacity * 0.07
    })
  }

  // Fog — lerp density
  if (_scene.fog) {
    _scene.fog.density = _lerp(LIGHTS.DAY_FOG_DENSITY, LIGHTS.NIGHT_FOG_DENSITY, p)
    _lerpColor.lerpColors(
      new THREE.Color(0x87ceeb),
      new THREE.Color(0x060a14),
      p
    )
    _scene.fog.color.copy(_lerpColor)
  }
}

export function getDayProgress() { return _dayProgress }

function _lerp(a, b, t) { return a + (b - a) * t }
```

- [ ] **Step 2: Wire into main.js temporarily to test**

In `src/main.js`, add these imports and calls (we'll do the full main.js cleanup in Task 6, but verify the cycle works now):

```js
// Add to imports:
import { buildSky } from './scene/Sky.js'  // already there, just note it returns refs now
import { initDayNight, updateDayNight } from './scene/DayNightCycle.js'

// After buildFloodlights and buildSky calls, add:
const { floodlights, ambientLight, sunLight, hemiLight } = buildFloodlights(scene)
const { skyUniforms, sunMeshes } = buildSky(scene)
initDayNight(scene, { ambient: ambientLight, sun: sunLight, floods: floodlights, skyUniforms, sunMeshes })

// In the animate() loop, add before renderer.render():
updateDayNight(elapsed)
```

Note: `buildSky` and `buildFloodlights` are currently called with no return capture in main.js. Update those two call sites to capture the return values.

- [ ] **Step 3: Visual verification — watch the sky change**

Open browser. Watch for ~60 seconds. The sky should visibly brighten/darken. Set `LIGHTS.DAY_NIGHT_DURATION` to `30` temporarily in Constants.js to speed up testing. Confirm:
- Sky starts blue (`#87ceeb`)
- Sun disc is visible at start, fades by 60% through the cycle
- Floodlights begin off, gradually brighten
- Fog density increases and colour darkens

Reset `DAY_NIGHT_DURATION` to `300` after verifying. **Do this before the commit in Step 4 — the commit includes Constants.js and you must not ship the test value.**

- [ ] **Step 4: Commit**

```bash
git add src/scene/DayNightCycle.js src/main.js src/utils/Constants.js
git commit -m "feat: add DayNightCycle — automatic 5min day-to-night transition"
```

---

## Task 5: MatchDayMode.js — Fix Null Guard and Boost Delta

**Files:**
- Modify: `src/scene/MatchDayMode.js`

- [ ] **Step 1: Remove setMatchDayLights import and add applyMatchDayBoost**

In `src/scene/MatchDayMode.js`:

1. Remove the import: `import { setMatchDayLights } from './Floodlights.js'`
2. Add import of LIGHTS: `import { LIGHTS } from '../utils/Constants.js'` (already imported indirectly — add if missing)
3. Add a `_floodsRef` variable at module level: `let _floodsRef = null`
4. Update `initMatchDayMode` to also accept floods:
```js
export function initMatchDayMode(sceneRef, cameraRef, floodsRef) {
  scene = sceneRef
  camera = cameraRef
  _floodsRef = floodsRef
}
```

5. Replace the `setMatchDayLights(active)` call in `toggleMatchDay` with:
```js
applyMatchDayBoost(_floodsRef, active)
```

6. Add `applyMatchDayBoost` function:
```js
function applyMatchDayBoost(floods, active) {
  if (!floods) return
  const target = active ? LIGHTS.FLOOD_INTENSITY_MATCHDAY : LIGHTS.FLOOD_INTENSITY
  floods.forEach(f => { f.intensity = target })
}
```

7. Fix the null-guard on the button:
```js
// Change from:
document.getElementById('matchday-btn').classList.toggle('active', active)
// To:
document.getElementById('matchday-btn')?.classList.toggle('active', active)
```

- [ ] **Step 2: Update main.js to pass floods to initMatchDayMode**

In `src/main.js`, update the `initMatchDayMode` call:
```js
// Change from:
initMatchDayMode(scene, camera)
// To:
initMatchDayMode(scene, camera, floodlights)
```

- [ ] **Step 3: Verify M key still works**

In browser, press M. Floodlights should spike to match-day brightness. Press M again — should return to current night level. No console errors about `setMatchDayLights`.

- [ ] **Step 4: Commit**

```bash
git add src/scene/MatchDayMode.js src/main.js
git commit -m "fix: MatchDayMode uses applyMatchDayBoost delta, null-guards matchday-btn"
```

---

## Task 6: PitchAtmosphere.js — Static Set Dressing

**Files:**
- Create: `src/scene/PitchAtmosphere.js`

- [ ] **Step 1: Create the module with corner flags, adboards, benches as pure meshes**

Create `src/scene/PitchAtmosphere.js`:

```js
import * as THREE from 'three'

export function buildPitchAtmosphere(scene) {
  _addCornerFlags(scene)
  _addAdboards(scene)
  _addDugoutBenches(scene)
}

function _addCornerFlags(scene) {
  const CORNERS = [[-52.5, -34], [-52.5, 34], [52.5, -34], [52.5, 34]]
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })

  CORNERS.forEach(([cx, cz]) => {
    const group = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), poleMat)
    pole.position.y = 0.75
    group.add(pole)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), flagMat)
    flag.position.set(0.17, 1.38, 0)
    group.add(flag)
    group.position.set(cx, 0, cz)
    scene.add(group)
  })
}

function _addAdboards(scene) {
  const POSITIONS = [
    [-30, 35], [-10, 35], [10, 35], [30, 35],
    [-30,-35], [-10,-35], [10,-35], [30,-35],
  ]
  const BW = 4.8, BH = 0.9, BD = 0.14
  const bgMat  = new THREE.MeshBasicMaterial({ color: 0x001122 })
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })

  POSITIONS.forEach(([ax, az]) => {
    const group = new THREE.Group()
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), bgMat)
    back.position.y = BH / 2
    group.add(back)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.8, 0.1, BD + 0.01), goldMat)
    stripe.position.y = BH - 0.08
    group.add(stripe)
    group.position.set(ax, 0, az)
    scene.add(group)
  })
}

function _addDugoutBenches(scene) {
  [[-35, 3], [35, 3]].forEach(([bx, bz]) => {
    const mat    = new THREE.MeshLambertMaterial({ color: 0x2a3545 })
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a2535 })
    const bench  = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.36, 1.1), mat)
    bench.position.set(bx, 0.35, bz)
    ;[-2, 0, 2].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 1.0), legMat)
      leg.position.set(lx, -0.42, 0)
      bench.add(leg)
    })
    scene.add(bench)
  })
}
```

- [ ] **Step 2: Add to main.js**

In `src/main.js`:
```js
// Add import:
import { buildPitchAtmosphere } from './scene/PitchAtmosphere.js'

// Add call after buildPitch(scene):
buildPitchAtmosphere(scene)
```

- [ ] **Step 3: Verify set dressing appears**

In browser: corner flags, adboards, and benches should be visible on the pitch — but now as decoration only (can drive through them if you position the car correctly, confirming no physics bodies).

- [ ] **Step 4: Commit**

```bash
git add src/scene/PitchAtmosphere.js src/main.js
git commit -m "feat: add PitchAtmosphere — static set dressing with no physics"
```

---

## Task 7: KnockableObjects.js — Rewrite

**Files:**
- Modify: `src/physics/KnockableObjects.js`

- [ ] **Step 1: Replace entire file**

Replace `src/physics/KnockableObjects.js` with the new object set. Keep `dynBody`, `addObject`, `syncKnockables`, `resetKnockables` helpers unchanged. Replace `initKnockables` body and all `_add*` functions:

```js
export function initKnockables(RAPIER, world, scene) {
  objects = []
  _addFootballs(RAPIER, world, scene)
  _addCones(RAPIER, world, scene)
  _addBoxes(RAPIER, world, scene)
  _addBoots(RAPIER, world, scene)
  _addTrophy(RAPIER, world, scene)
  return objects
}

function _addFootballs(RAPIER, world, scene) {
  const SPAWNS = [
    [0,0],[8,-6],[-8,-6],[15,8],[-15,8],[20,-15],[-20,-15],
    [5,20],[-5,20],[12,-22],[-12,-22],[0,-28],
  ]
  const mat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })
  const patchMat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, opacity: 0.15, transparent: true })

  SPAWNS.forEach(([x, z]) => {
    const R = 0.22
    const body = dynBody(RAPIER, world, x, R + 0.1, z, 0.45, 0.2, 0.3)
    world.createCollider(RAPIER.ColliderDesc.ball(R).setRestitution(0.78).setFriction(0.4), body)
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 16, 16), mat)
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.001, 8, 8), patchMat))
    addObject(body, mesh, scene)
  })
}

function _addCones(RAPIER, world, scene) {
  const SPAWNS = [[-18,12],[−16,14],[10,18],[12,20],[−25,−8],[−23,−6]]
  const mat = new THREE.MeshLambertMaterial({ color: 0xff6a00 })

  SPAWNS.forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.14, z, 0.3, 1.0, 0.6)
    world.createCollider(RAPIER.ColliderDesc.ball(0.13).setRestitution(0.3), body)
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 8), mat)
    addObject(body, mesh, scene)
  })
}

function _addBoxes(RAPIER, world, scene) {
  const SPAWNS = [[−40,25],[40,25],[−40,−25],[40,−25]]
  const mat = new THREE.MeshLambertMaterial({ color: 0xc8a060 })

  SPAWNS.forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.5, z, 8, 0.8, 1.2)
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setRestitution(0.2), body)
    // Simple crate with edge lines
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), mat)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
      new THREE.LineBasicMaterial({ color: 0x8a6030 })
    )
    mesh.add(edges)
    addObject(body, mesh, scene)
  })
}

function _addBoots(RAPIER, world, scene) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffd700 })
  const soleMat = new THREE.MeshLambertMaterial({ color: 0x222222 })

  [[-6, 0], [6, 0]].forEach(([x, z]) => {
    const body = dynBody(RAPIER, world, x, 0.2, z, 1.2, 0.7, 0.9)
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.15, 0.4).setRestitution(0.25), body)

    const group = new THREE.Group()
    // Upper
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.75), mat)
    upper.position.y = 0.1
    group.add(upper)
    // Sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.06, 0.80), soleMat)
    sole.position.y = -0.04
    group.add(sole)
    addObject(body, group, scene)
  })
}

function _addTrophy(RAPIER, world, scene) {
  const goldMat  = new THREE.MeshLambertMaterial({ color: 0xffd700 })
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x9a7000 })

  const body = dynBody(RAPIER, world, 0, 0.4, 0, 3, 1.2, 1.5)
  world.createCollider(RAPIER.ColliderDesc.cylinder(0.4, 0.12).setRestitution(0.15), body)

  const group = new THREE.Group()
  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.14, 8), darkMat)
  base.position.y = -0.3
  group.add(base)
  // Stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.10, 0.55, 8), goldMat)
  stem.position.y = 0
  group.add(stem)
  // Cup
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.07, 0.42, 12, 1, true), goldMat)
  cup.position.y = 0.42
  group.add(cup)
  // Handles (simple boxes)
  ;[-1, 1].forEach(side => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.025, 6, 8, Math.PI), goldMat)
    handle.rotation.z = side * Math.PI / 2
    handle.position.set(side * 0.22, 0.45, 0)
    group.add(handle)
  })

  addObject(body, group, scene)
}
```

- [ ] **Step 2: Fix syntax — use actual negative numbers not Unicode minus**

After writing the file, check the `SPAWNS` arrays — use `-18` not `−18` (ensure ASCII minus signs throughout).

- [ ] **Step 3: Verify in browser**

In browser: drive around the pitch. Should see 12 footballs, 6 orange cones, 4 wooden boxes in corners, 2 gold boots near midfield, 1 trophy at centre circle. All should be physically interactive — car bumps knock them around.

- [ ] **Step 4: Commit**

```bash
git add src/physics/KnockableObjects.js
git commit -m "feat: rewrite KnockableObjects — footballs, cones, boxes, boots, trophy"
```

---

## Task 8: Zone Files — Reduce to 3

**Files:**
- Create: `src/zones/WhoIAmZone.js`, `src/zones/SkillsZone.js`, `src/zones/ProjectsZone.js`
- Delete: `src/zones/MidfieldCircle.js`, `src/zones/BuilderTunnel.js`, `src/zones/LockerRoom.js`, `src/zones/TransferMarket.js`, `src/zones/ExpansionWing.js`, `src/zones/TheArchive.js`

- [ ] **Step 1: Create the shared billboard builder helper inside ZoneManager (next task) — for now create zone stubs**

Each zone module needs a `build(scene)` method that creates a large canvas billboard mounted on a post. Create all three with identical structure, different content.

Create `src/zones/WhoIAmZone.js`:

```js
import * as THREE from 'three'

export class WhoIAmZone {
  build(scene) {
    _buildBillboard(scene, {
      color: '#ffd700',
      lines: [
        { text: 'AYOOLA MORAKINYO',        size: 32, bold: true,  color: '#ffd700' },
        { text: 'Founder · Builder · Atlanta, GA', size: 18, bold: false, color: 'rgba(255,255,255,0.7)' },
        { text: '',                         size: 12 },
        { text: 'Masters student. Former athlete.', size: 20, bold: false, color: '#ffffff' },
        { text: 'Building the authentication layer', size: 20, bold: false, color: '#ffffff' },
        { text: 'for the sneaker economy.',  size: 20, bold: false, color: '#ffffff' },
        { text: '',                         size: 12 },
        { text: "When I'm not training ML models", size: 17, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: "I'm on the pitch. This stadium is both.", size: 17, bold: false, color: 'rgba(255,255,255,0.6)' },
      ],
      position: [0, 0, -45],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
```

Create `src/zones/SkillsZone.js`:

```js
import * as THREE from 'three'

export class SkillsZone {
  build(scene) {
    _buildBillboard(scene, {
      color: '#00e5ff',
      lines: [
        { text: 'WHAT I BUILD WITH',        size: 30, bold: true,  color: '#00e5ff' },
        { text: '',                          size: 10 },
        { text: 'AI / ML',                  size: 22, bold: true,  color: '#ffffff' },
        { text: 'PyTorch · EfficientNet · Roboflow', size: 17, bold: false, color: 'rgba(255,255,255,0.65)' },
        { text: '',                          size: 8 },
        { text: 'Full-Stack',               size: 22, bold: true,  color: '#ffffff' },
        { text: 'React · Node · Supabase · Vite', size: 17, bold: false, color: 'rgba(255,255,255,0.65)' },
        { text: '',                          size: 8 },
        { text: 'Scraping  ·  Mobile  ·  Infra', size: 17, bold: false, color: 'rgba(255,255,255,0.5)' },
        { text: 'Playwright · React Native · Vercel', size: 15, bold: false, color: 'rgba(255,255,255,0.4)' },
      ],
      position: [-55, 0, 0],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
```

Create `src/zones/ProjectsZone.js`:

```js
import * as THREE from 'three'

export class ProjectsZone {
  build(scene) {
    _buildBillboard(scene, {
      color: '#00c853',
      lines: [
        { text: 'WHAT I\'VE BUILT',          size: 30, bold: true,  color: '#00c853' },
        { text: '',                           size: 10 },
        { text: 'MDFLD — Boot Verification', size: 22, bold: true,  color: '#ffffff' },
        { text: 'EfficientNet-B4 · 10k images · 99%+ target', size: 15, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: '',                           size: 8 },
        { text: 'Allstar Kids Academy',       size: 22, bold: true,  color: '#ffffff' },
        { text: 'Full-stack rebuild · ProCare API · enrollment', size: 15, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: '',                           size: 8 },
        { text: 'Boot Scraper — Training Data', size: 22, bold: true, color: '#ffffff' },
        { text: '153 products · 1,005 images · rareboots · bootroom', size: 14, bold: false, color: 'rgba(255,255,255,0.6)' },
      ],
      position: [55, 0, 0],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
```

**Before creating the three zone files**, create a shared helper `src/zones/billboardBuilder.js` and import it in all three. Do NOT copy-paste `_buildBillboard` into each zone file — if it's duplicated, a change in one won't propagate to the others.

Create `src/zones/billboardBuilder.js`:

```js
function _buildBillboard(scene, { color, lines, position }) {
  // Canvas texture
  const W = 1024, H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = 'rgba(6, 10, 20, 0.88)'
  ctx.roundRect(0, 0, W, H, 18)
  ctx.fill()

  // Color top border
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, 4)

  // Draw lines
  let y = 48
  lines.forEach(({ text, size, bold, color: c }) => {
    if (!text) { y += size || 10; return }
    ctx.font = `${bold ? '700' : '400'} ${size}px "Orbitron", "Inter", sans-serif`
    ctx.fillStyle = c || '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(text, W / 2, y)
    y += size * 1.55
  })

  const texture = new THREE.CanvasTexture(canvas)

  // Billboard plane — 8 × 5 world units
  const BW = 8, BH = 5
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(BW, BH),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  )

  // Post
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 6, 8),
    new THREE.MeshLambertMaterial({ color: 0x2a3545 })
  )

  const group = new THREE.Group()
  post.position.y = 3
  mesh.position.y = 7.5
  group.add(post)
  group.add(mesh)
  group.position.set(...position)

  // Store refs on group for ZoneManager to drive opacity
  group.userData.billboardMesh = mesh
  group.userData.billboardMat  = mesh.material

  scene.add(group)
  return mesh.material   // caller can store for direct opacity control
}
```

Then add this import at the top of each zone file:
```js
import { buildBillboard } from './billboardBuilder.js'
```
And call `buildBillboard(scene, { ... })` instead of `_buildBillboard(scene, { ... })`.

- [ ] **Step 2: Delete the 6 old zone files**

```bash
cd /Users/ayoola/Desktop/portfolio/src/zones
rm MidfieldCircle.js BuilderTunnel.js LockerRoom.js TransferMarket.js ExpansionWing.js TheArchive.js
```

- [ ] **Step 3: Commit**

```bash
cd /Users/ayoola/Desktop/portfolio
git add src/zones/
git commit -m "feat: add 3 billboard zones (WhoIAm, Skills, Projects), delete old 6 zones"
```

---

## Task 9: ZoneManager.js — 3 Zones + Billboard Fade

**Files:**
- Modify: `src/zones/ZoneManager.js`

- [ ] **Step 1: Rewrite ZoneManager to use 3 new zones and distance-based billboard fade**

Replace `src/zones/ZoneManager.js`:

```js
import * as THREE from 'three'
import { EventBus } from '../utils/EventBus.js'
import { ZONES } from '../utils/Constants.js'

import { WhoIAmZone }   from './WhoIAmZone.js'
import { SkillsZone }   from './SkillsZone.js'
import { ProjectsZone } from './ProjectsZone.js'

const BEACON_COLORS = {
  whoIAm:   0xffd700,
  skills:   0x00e5ff,
  projects: 0x00c853,
}

const zoneModules = {
  whoIAm:   WhoIAmZone,
  skills:   SkillsZone,
  projects: ProjectsZone,
}

const zones   = []
const beacons = []
let sceneRef  = null

export function initZones(scene) {
  sceneRef = scene

  Object.entries(ZONES).forEach(([key, def]) => {
    const posVec = new THREE.Vector3(...def.position)
    zones.push({
      ...def,
      posVec,
      module: new zoneModules[key](),
      initialized: false,
      playerInside: false,
    })
    _buildBeacon(scene, key, def, posVec)
  })
}

function _buildBeacon(scene, key, def, pos) {
  const color = BEACON_COLORS[key] ?? 0xffffff
  const group = new THREE.Group()
  group.position.set(pos.x, 0, pos.z)

  const columnGeo = new THREE.CylinderGeometry(0.18, 0.35, 22, 8, 1, true)
  const columnMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  const column    = new THREE.Mesh(columnGeo, columnMat)
  column.position.y = 11
  group.add(column)

  const orbGeo = new THREE.SphereGeometry(0.55, 10, 8)
  const orbMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  const orb    = new THREE.Mesh(orbGeo, orbMat)
  orb.position.y = 23
  group.add(orb)

  const ptLight = new THREE.PointLight(color, 1.5, 28)
  ptLight.position.y = 23
  group.add(ptLight)

  const ringGeo = new THREE.RingGeometry(def.radius - 0.5, def.radius, 48)
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
  const ring    = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.04
  group.add(ring)

  scene.add(group)
  beacons.push({ group, orb, column, ring, ringMat, columnMat, orbMat, ptLight })
}

export function updateZones(playerPos) {
  const t = Date.now() * 0.001

  zones.forEach((zone, i) => {
    const dist     = playerPos.distanceTo(zone.posVec)
    const wasInside = zone.playerInside
    zone.playerInside = dist < zone.radius

    if (!wasInside && zone.playerInside) {
      if (!zone.initialized) {
        if (typeof zone.module.build !== 'function') {
          console.warn(`[ZoneManager] Zone "${zone.id}" missing build() — skipping`)
        } else {
          zone.module.build(sceneRef)
        }
        zone.initialized = true
      }
      zone.module.onEnter?.()
      EventBus.emit('zone:enter', zone.id, zone.label)
    }

    if (wasInside && !zone.playerInside) {
      zone.module.onExit?.()
      EventBus.emit('zone:exit', zone.id)
    }

    if (zone.playerInside && zone.initialized) {
      zone.module.update?.(t)
    }

    // Billboard distance fade — full at radius*0.6, zero at radius*1.2
    if (zone.initialized) {
      const FULL_DIST = zone.radius * 0.6    // 10.8
      const FADE_DIST = zone.radius * 1.2    // 21.6
      const alpha = dist <= FULL_DIST ? 1
                  : dist >= FADE_DIST ? 0
                  : 1 - (dist - FULL_DIST) / (FADE_DIST - FULL_DIST)
      // Find billboard mesh inside zone module's built group
      sceneRef.traverse(obj => {
        if (obj.userData.billboardMat && obj.parent?.position.distanceTo(zone.posVec) < 1) {
          obj.userData.billboardMat.opacity = alpha
        }
      })
    }

    // Beacon pulse
    const b = beacons[i]
    if (b) {
      const inside = zone.playerInside
      const pulse  = 0.5 + Math.sin(t * 1.6 + i) * 0.5
      b.columnMat.opacity = inside ? 0 : 0.08 + pulse * 0.12
      b.orbMat.opacity    = inside ? 0 : 0.55 + pulse * 0.35
      b.ringMat.opacity   = inside ? 0 : 0.06 + pulse * 0.10
      b.ptLight.intensity = inside ? 0 : 1.0 + pulse * 1.5
      b.orb.position.y    = 23 + Math.sin(t * 1.2 + i) * 0.4
    }
  })
}
```

- [ ] **Step 2: Verify zones in browser**

Drive toward each zone beacon. As you enter (within ~21.6 units), a billboard should materialise on a post. It should be fully opaque when you're within ~10.8 units and fade as you back away.

- [ ] **Step 3: Commit**

```bash
git add src/zones/ZoneManager.js
git commit -m "feat: ZoneManager — 3 zones with distance-fading billboards"
```

---

## Task 10: SpeechBubble.js — New Module

**Files:**
- Create: `src/npcs/SpeechBubble.js`

- [ ] **Step 1: Create the module**

Create `src/npcs/SpeechBubble.js`:

```js
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
```

- [ ] **Step 2: No visual test yet** — this module is used by NPCBase (next task).

- [ ] **Step 3: Commit**

```bash
git add src/npcs/SpeechBubble.js
git commit -m "feat: SpeechBubble — in-world Three.js Sprite that streams NPC dialogue"
```

---

## Task 11: NPCBase.js — Remove Labels, Add Bubble

**Files:**
- Modify: `src/npcs/NPCBase.js`

- [ ] **Step 1: Import SpeechBubble and remove static label sprites**

In `src/npcs/NPCBase.js`:

1. Add import at top:
```js
import { SpeechBubble } from './SpeechBubble.js'
```

2. In `build(scene)`, delete the two label sprite blocks (lines 49–58):
```js
// DELETE these two blocks:
// Name label sprite
const labelSprite = makeLabel(...)
labelSprite.position.set(0, 2.9, 0)
this.group.add(labelSprite)

// Role sub-label
const roleSprite = makeLabel(...)
roleSprite.position.set(0, 2.45, 0)
this.group.add(roleSprite)
```

3. After the group is assembled (after `this.group.add(this.ring)`), add:
```js
// Speech bubble
this.bubble = new SpeechBubble(this.id)
this.group.add(this.bubble.sprite)
```

4. Change the `update(t)` signature to `update(t, delta)` so it receives the real frame delta. Then at the end of `update`:
```js
if (this.bubble) this.bubble.update(delta ?? 0.016)
```

Then in `src/npcs/NPCManager.js`, update the call from `npc.update(elapsed)` to `npc.update(elapsed, delta)` — `delta` is already available as the first argument to `updateNPCs(delta, elapsed, carPos)`.

- [ ] **Step 2: Verify in browser**

No labels should appear above NPC heads. The glow orb and ring should still animate. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/npcs/NPCBase.js
git commit -m "feat: NPCBase — remove static labels, attach SpeechBubble sprite"
```

---

## Task 12: BuilderNPC.js + Update Dialogues

**Files:**
- Create: `src/npcs/BuilderNPC.js`
- Modify: `src/data/dialogues.js`
- Delete: `src/npcs/CTOnpc.js`, `src/npcs/InvestorNPC.js`, `src/npcs/CommunityNPC.js`

- [ ] **Step 1: Create BuilderNPC.js**

Create `src/npcs/BuilderNPC.js`:

```js
import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class BuilderNPC extends NPCBase {
  constructor() {
    const d = NPCS.builder
    super({ ...d, emoji: '⚙️' })
  }
}
```

- [ ] **Step 2: Add builder dialogue bank, remove stale entries**

Open `src/data/dialogues.js`. Remove the `cto`, `investor`, and `community` entries. Add `builder`:

```js
builder: [
  "Every product here was built by one person. That's the point — tools are powerful enough now that a solo founder can ship what took teams five years ago.",
  "The scraper, the ML pipeline, the family portal — all of it is production code. Not demos. Not tutorials. Real software solving real problems.",
  "I'm proving that taste + technical skill + relentless focus beats a team without vision. Come find me when you're ready to build something that matters.",
  "Check the Projects zone to the east. 153 scraped products, 10k boot images, a full-stack enrollment system. That's what nights and weekends look like.",
],
```

- [ ] **Step 3: Delete old NPC files**

```bash
cd /Users/ayoola/Desktop/portfolio/src/npcs
rm CTOnpc.js InvestorNPC.js CommunityNPC.js
```

- [ ] **Step 4: Commit**

```bash
cd /Users/ayoola/Desktop/portfolio
git add src/npcs/BuilderNPC.js src/data/dialogues.js src/npcs/
git commit -m "feat: add BuilderNPC, update dialogue bank, remove 3 unused NPCs"
```

---

## Task 13: NPCManager.js — 2 NPCs, Show/Hide Bubble

**Files:**
- Modify: `src/npcs/NPCManager.js`

- [ ] **Step 1: Rewrite NPCManager for 2 NPCs and proximity-based bubble control**

Replace `src/npcs/NPCManager.js`:

```js
import * as THREE from 'three'
import { AyoolaNPC }  from './AyoolaNPC.js'
import { BuilderNPC } from './BuilderNPC.js'
import { EventBus }   from '../utils/EventBus.js'
import { PLAYER }     from '../utils/Constants.js'

let npcs = []
let nearbyNPC = null

export function initNPCs(scene) {
  npcs = [new AyoolaNPC(), new BuilderNPC()]
  npcs.forEach(npc => npc.build(scene))
}

export function updateNPCs(delta, elapsed, carPos) {
  const prevNearby = nearbyNPC
  nearbyNPC = null

  npcs.forEach(npc => {
    npc.update(elapsed)

    const dist = carPos.distanceTo(
      new THREE.Vector3(npc.group.position.x, carPos.y, npc.group.position.z)
    )

    if (dist < PLAYER.NPC_INTERACT_DISTANCE) {
      nearbyNPC = npc
      npc.lookAt(carPos)
    }
  })

  // Show bubble when entering range, hide when leaving
  if (nearbyNPC !== prevNearby) {
    if (prevNearby) prevNearby.bubble?.hide()
    if (nearbyNPC)  nearbyNPC.bubble?.show()
  }

  // Clear old E-key HUD prompt — no interaction required in new design
  EventBus.emit('hud:prompt:clear')
}
```

- [ ] **Step 2: Verify in browser**

Drive toward Ayoola (centre, x:0 z:10). Within ~8 units a speech bubble should fade in above their head with streaming text. Drive away — bubble fades to 0. Drive back — new dialogue cycle starts.

- [ ] **Step 3: Commit**

```bash
git add src/npcs/NPCManager.js
git commit -m "feat: NPCManager — 2 NPCs with proximity speech bubble show/hide"
```

---

## Task 14: HUD.js + index.html — Remove Dead Elements

**Files:**
- Modify: `src/ui/HUD.js`
- Modify: `index.html`
- Delete: `src/ui/DialogueModal.js`

- [ ] **Step 1: Simplify HUD.js**

Replace `src/ui/HUD.js` to remove zone/prompt bindings (those elements will be gone from HTML):

```js
import { EventBus } from '../utils/EventBus.js'

const fpsEl = document.getElementById('fps-counter')

export function initHUD() {
  // zone:enter / zone:exit handled by in-world billboards — no HUD label needed
  // hud:prompt handled by speech bubbles — no HUD prompt needed
}

export function updateFPS(fps) {
  if (fpsEl) fpsEl.textContent = `${Math.round(fps)} FPS`
}
```

- [ ] **Step 2: Remove dead HTML in index.html**

In `index.html`, remove these elements:
- The entire `#dialogue-modal` div and all its children
- The `#matchday-btn` button
- The `#hud-zone` element
- The `#hud-prompt` element
- Any CSS blocks scoped to those selectors (`.dialogue-*`, `#matchday-btn`, `#hud-zone`, `#hud-prompt`)

Keep:
- `#fps-counter`
- `#hud` (the container)
- Reset hint element (add one if missing): `<div id="reset-hint" style="position:fixed;bottom:1rem;right:1rem;font-size:0.7rem;color:rgba(255,255,255,0.2);font-family:'Inter',sans-serif;pointer-events:none">R — reset car</div>`
- Loading screen, pointer-lock overlay, canvas

- [ ] **Step 3: Remove DialogueModal.js import from main.js**

In `src/main.js`, remove:
```js
import { initDialogue } from './ui/DialogueModal.js'
// and the call:
initDialogue()
```

Delete the file:
```bash
rm /Users/ayoola/Desktop/portfolio/src/ui/DialogueModal.js
```

- [ ] **Step 4: Verify no console errors**

In browser: no errors about missing elements or undefined functions. HUD should only show FPS counter and reset hint.

- [ ] **Step 5: Commit**

```bash
cd /Users/ayoola/Desktop/portfolio
git add src/ui/HUD.js index.html src/main.js src/ui/
git commit -m "feat: remove dialogue modal, matchday button, zone/prompt HUD — world is the UI"
```

---

## Task 15: Final main.js Cleanup

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Audit and tidy main.js**

Ensure `src/main.js` has:
- `buildFloodlights` capturing `{ floodlights, ambientLight, sunLight, hemiLight }`
- `buildSky` capturing `{ skyUniforms, sunMeshes }`
- `initDayNight(scene, { ambient: ambientLight, sun: sunLight, floods: floodlights, skyUniforms, sunMeshes })` called after both
- `buildPitchAtmosphere(scene)` called after `buildPitch(scene)`
- `initMatchDayMode(scene, camera, floodlights)` (updated signature)
- `updateDayNight(elapsed)` called in the animate loop
- No remaining imports of `DialogueModal`, `playUISound` from AudioManager for dialogue events, or stale EventBus wiring for `audio:ui` / `npc:interact`
- EventBus `audio:zone` wiring retained (zone entry sounds still work)

- [ ] **Step 2: Full end-to-end smoke test**

Open browser. Verify:
1. World loads — sky is daytime blue, pitch is vivid green
2. Car is drivable — WASD/arrows work, physics feels snappy
3. Knock footballs around the pitch — 12 balls scatter satisfyingly
4. Drive toward zone beacon (z: -45 for Who I Am) — billboard fades in on approach
5. Drive toward Ayoola NPC (x:0 z:10) — speech bubble appears, text streams
6. Drive away — bubble fades out
7. Wait 2–3 minutes — sky should visibly darken, floodlights brightening
8. Press M — Match Day boost activates (floodlights spike, cinematic camera orbits)
9. Press R — car resets, footballs return to positions
10. No console errors throughout

- [ ] **Step 3: Final commit**

```bash
cd /Users/ayoola/Desktop/portfolio
git add src/main.js
git commit -m "feat: complete Bruno Simon redesign — physics pitch, billboard zones, speech bubbles, day/night cycle"
```

---

## Completion Checklist

- [ ] Constants updated (3 zones, 2 NPCs, day/night values)
- [ ] Floodlights is pure builder
- [ ] Sky returns shader refs
- [ ] DayNightCycle drives all lighting automatically
- [ ] MatchDayMode M key still works without crashing
- [ ] PitchAtmosphere adds static set dressing
- [ ] KnockableObjects has 25 new physics items (12 balls + 6 cones + 4 boxes + 2 boots + 1 trophy)
- [ ] 3 billboard zones render and fade by proximity
- [ ] Speech bubbles appear/stream/cycle on NPC proximity
- [ ] Old modal, 4 NPCs, 6 zones, matchday button all deleted
- [ ] No console errors on load or during play
