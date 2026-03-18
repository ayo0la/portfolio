# MDFLD Stadium Portfolio — Bruno Simon-Style Redesign

**Date:** 2026-03-17
**Status:** Approved
**Stack:** Three.js 0.172 · Rapier 3D 0.19 · Vite 6 · Vanilla JS

---

## Goal

Redesign the existing 3D stadium portfolio to match the core UX of Bruno Simon's portfolio (bruno-simon.com) — physics-driven interaction, content discovered through exploration, and the world as the interface (no UI overlays). The stadium theme and personal branding (Ayoola / MDFLD) are preserved throughout.

---

## Core UX Principles

1. **The world IS the interface** — no modal popups, no HUD zone labels, no dialogue windows
2. **Navigation is movement** — you drive to content, content doesn't come to you
3. **Physics is fun first** — knockable objects exist for satisfaction, not information
4. **Discoverable by exploration** — no prescribed path, no tutorial, just curiosity

---

## World Structure

### 3 Content Zones (replacing current 6)

| Zone | Position | Content |
|------|----------|---------|
| Who I Am | North end (z: -45) | Personal story, background, why MDFLD exists |
| Skills | West side (x: -55) | ML/AI, full-stack, PyTorch, React, Python, Node |
| Projects | East side (x: +55) | MDFLD, childcare app (allstarkidsacademyga), scraper |

Each zone contains:
- **One large 3D billboard** (canvas texture panel, ~8×5 units) mounted on a post
- **Zone beacon** (existing pulsing column + orb, retained)
- **Zone accent color** (Who I Am: `#ffd700`, Skills: `#00e5ff`, Projects: `#00c853`)

Billboard content fades in/out based on distance. Each new zone has `radius: 18` in `Constants.js`. Fade curve: full opacity at `18 × 0.6 = 10.8` units, fully transparent at `18 × 1.2 = 21.6` units, linear interpolation between. No click or keypress needed.

### Open Pitch — Physics Playground

The pitch between zones is populated with knockable rigid bodies. All are purely fun — none reveal content on collision.

**Object set:**
- 12× footballs (sphere colliders, r=0.22, scattered randomly each session)
- 6× training cones (cylinder colliders, h=0.5 r=0.12, grouped in 2-cone clusters)
- 4× cardboard boxes (cuboid colliders, 0.5×0.5×0.5, stacked in corners)
- 2× large boots (cuboid approximation, 0.4×0.3×0.8, near midfield)
- 1× trophy (cylinder collider h=0.8, placed at centre circle)

Objects reset to spawn positions with the existing `R` key reset.

**Static atmosphere objects**: the current `KnockableObjects.js` contains six object-building functions — `_addCornerFlags`, `_addAdboards`, `_addDugoutBenches`, `_addSponsorCrates`, `_addTripods`, and `_addWaterBottles`. All six are removed from `KnockableObjects.js` during the rewrite. Corner flags, adboards, and dugout benches are recreated as plain `THREE.Mesh` objects (no Rapier body) inside `src/scene/PitchAtmosphere.js` as visual set dressing. Sponsor crates, tripods, and water bottles are **deleted entirely** — they do not fit the stadium-authentic aesthetic of the new design and the pitch is already well-populated with the new object set.

---

## NPC Overhaul

### Reduce to 2 NPCs
- **Ayoola** (`id: 'ayoola'`) — positioned near centre (x:0, z:10), tells your personal story
- **Builder** (`id: 'builder'`) — positioned near Projects zone (x:48, z:0), talks about what you build

Remove CTOnpc, InvestorNPC, CommunityNPC.

`src/data/dialogues.js` is updated: remove `cto`, `investor`, `community` entries; add `builder` dialogue bank (4 lines cycling, same structure as existing entries).

### Speech Bubbles (replace modal)
Replace `DialogueModal` popup with an in-world floating speech bubble:

- Rendered as a `THREE.Sprite` with a `CanvasTexture` (320×160px canvas)
- Positioned at y=4.3 world units above NPC group origin (head is at y≈1.80, bubble clears it cleanly)
- Appears when car is within `NPC_INTERACT_DISTANCE`; fades out (opacity lerp to 0) when car moves away
- Text streams word-by-word via `ClaudeClient.streamDialogue(npcId)` async generator; canvas is re-drawn on each yielded word
- No button interaction — text cycles automatically: new dialogue triggers after 6s pause once streaming finishes, while car remains in range
- `NPCBase.js` static name/role label sprites (currently at y=2.9 and y=2.45 — identified in `NPCBase.build()`) are **removed** — the speech bubble replaces them
- If the car leaves range mid-stream, the stream is cancelled immediately (set a `cancelled` flag checked in the generator loop) and the bubble fades to opacity 0

**SpeechBubble interface** (`src/npcs/SpeechBubble.js`):
- Each NPC owns one `SpeechBubble` instance, created inside `NPCBase.build()` and added to `this.group`
- Exposes: `show()` — triggers a new `streamDialogue()` call and starts streaming text into canvas; `hide()` — cancels any in-progress stream and fades opacity to 0; `update(delta)` — ticks opacity lerp each frame
- `ClaudeClient.streamDialogue(this.id)` is called internally by `SpeechBubble.show()` — `NPCBase`/`NPCManager` never call `ClaudeClient` directly
- `NPCManager` calls `npc.bubble.show()` on proximity enter and `npc.bubble.hide()` on proximity exit
- `NPCBase.update(t)` calls `this.bubble.update(delta)` at the end of its existing update cycle so the opacity lerp is ticked every frame

**No modal HTML element needed** — `#dialogue-modal` can be removed from `index.html`.

---

## Visual Tone — Day→Night Cycle

### Day Start (t=0)
- Sky: light blue (`#87ceeb`) with white clouds (billboard texture quad)
- Ambient light: warm white, intensity 2.8
- Directional sun: intensity 4.5, angle 45°
- Pitch: vivid saturated green (existing `GRASS_DARK`/`GRASS_LIGHT` kept)
- Fog: `FogExp2`, density 0.003 (light, Bruno Simon style)
- Floodlights: OFF (intensity 0)

### Transition (t=0 → t=300s)
A single `dayProgress` scalar (0→1) driven by `clock.getElapsedTime() / 300` (clamped to 1).

Each frame, lerp all lighting parameters between day and night values:
- Sky color: `#87ceeb` → `#060a14`
- Ambient intensity: 2.8 → 1.2
- Sun intensity: 4.5 → 0 (sun sets)
- Floodlight intensity: 0 → 1.8
- Fog density: 0.003 → 0.0018
- Seat emissive brightness: 0 → slight glow

### Night End (t≥300s)
Identical to current cinematic night mode. The existing `MatchDayMode` toggle (M key) continues to work as a "full match day" boost on top of the night state.

### Sky Rendering
The existing `Sky.js` uses a `THREE.ShaderMaterial` with `topColor` and `horizonColor` uniforms plus a visible sun disc mesh and cloud quads. The rewrite **retains the gradient shader approach** — `DayNightCycle` lerps the `topColor` and `horizonColor` shader uniforms each frame rather than setting `scene.background`. The sun disc mesh visibility is driven by `dayProgress`: fully visible at 0, faded to opacity 0 by `dayProgress = 0.6`.

### Lighting Coordination
`DayNightCycle.js` is the **single source of truth** for base lighting state. To prevent conflicts:

- `Floodlights.js` becomes a **pure builder** — it creates and returns light references but owns no setters. All intensity writes happen in `DayNightCycle`.
- `MatchDayMode.js` applies its boost as a **delta on top** of the current night values rather than setting absolute intensities. It reads the base night floodlight intensity from `DayNightCycle` and multiplies by `LIGHTS.FLOOD_INTENSITY_MATCHDAY / LIGHTS.FLOOD_INTENSITY`.
- The `#matchday-btn` DOM reference in `MatchDayMode.js` is guarded with optional chaining (`?.`) before the button is removed from `index.html`.

### Implementation
New module: `src/scene/DayNightCycle.js`
- Exports `initDayNight(scene, lights)`, `updateDayNight(elapsed)`, and `getDayProgress()`
- `lights` param: `{ ambient, sun, floods[], skyUniforms, sunDiscMesh }`
- Owns all day/night lerp logic using `dayProgress = Math.min(elapsed / 300, 1)`
- `getDayProgress()` returns the current `dayProgress` scalar (0=day, 1=night) so external systems can read current state without owning lighting refs

`MatchDayMode.js` reads the base night floodlight intensity directly from `LIGHTS.FLOOD_INTENSITY` in `Constants.js` when computing its boost delta. It does **not** call `getDayProgress()` — it simply applies `LIGHTS.FLOOD_INTENSITY_MATCHDAY` as an absolute target and lets `DayNightCycle` handle the base-to-matchday blend. The deleted `setMatchDayLights()` function from `Floodlights.js` is replaced by a new `applyMatchDayBoost(floods, active)` function inside `MatchDayMode.js` itself, which lerps flood intensity between `LIGHTS.FLOOD_INTENSITY` (off) and `LIGHTS.FLOOD_INTENSITY_MATCHDAY` (on) as a self-contained delta.

---

## HUD Cleanup

### Remove
- Zone label (`#hud-zone`) — replaced by in-world billboards
- Interaction prompt for NPCs (`#hud-prompt`) — no interaction required
- Match Day button (`#matchday-btn`) — M key still works, button removed

### Keep
- FPS counter (dev utility, keep hidden by default, toggle with F key)
- Reset hint (small fixed text: "R — reset car")
- Pointer lock overlay

---

## Billboard Content

### Who I Am
```
AYOOLA MORAKINYO
Founder · Builder · Atlanta, GA

Masters student. Former athlete. Building the
authentication layer for the sneaker economy.

When I'm not training ML models I'm on the pitch.
This stadium is both.
```

### Skills
```
WHAT I BUILD WITH

AI / ML          PyTorch · EfficientNet · Roboflow
Full-Stack       React · Node · Supabase · Vite
Scraping         Playwright · Python · multi-site
Mobile           React Native (learning)
Infrastructure   Vercel · GitHub Actions
```

### Projects
```
MDFLD — Real vs Fake Boot Verification
  EfficientNet-B4 · 10k images · 99%+ target accuracy

Allstar Kids Academy — Family Portal
  Full-stack rebuild · ProCare API · enrollment flow

Boot Scraper — Training Data Pipeline
  153 products · 1,005 images · rareboots · bootroom
```

---

## Files Changed / Created

| File | Change |
|------|--------|
| `src/main.js` | **Update** — wire DayNightCycle with lights from Floodlights+Sky; remove DialogueModal import |
| `src/scene/DayNightCycle.js` | **New** — day→night lerp system, single lighting source of truth, exports getDayProgress() |
| `src/scene/Sky.js` | **Rewrite** — shader uniforms + sun disc driven by DayNightCycle |
| `src/scene/Floodlights.js` | **Update** — pure builder, returns light refs, removes setMatchDayLights() setter |
| `src/scene/MatchDayMode.js` | **Update** — null guard on matchday-btn; new applyMatchDayBoost() replaces setMatchDayLights() |
| `src/scene/PitchAtmosphere.js` | **New** — static set dressing (corner flags, adboards, benches) |
| `src/ui/HUD.js` | **Update** — remove zone label and prompt bindings; remove references to deleted #hud-zone and #hud-prompt elements |
| `src/zones/ZoneManager.js` | **Update** — 3 zones only, billboard distance-based opacity fade |
| `src/zones/MidfieldCircle.js` | **Delete** (replaced by Who I Am zone) |
| `src/zones/BuilderTunnel.js` | **Repurpose** → WhoIAmZone.js |
| `src/zones/LockerRoom.js` | **Delete** |
| `src/zones/TransferMarket.js` | **Delete** |
| `src/zones/ExpansionWing.js` | **Delete** |
| `src/zones/TheArchive.js` | **Repurpose** → ProjectsZone.js |
| `src/zones/SkillsZone.js` | **New** |
| `src/npcs/NPCManager.js` | **Update** — 2 NPCs only, speech bubble trigger |
| `src/npcs/NPCBase.js` | **Update** — remove label sprite (y=2.9) and role sprite (y=2.45); create SpeechBubble instance in build() |
| `src/npcs/AyoolaNPC.js` | **No change** — reads position from Constants.js NPCS.ayoola; position update is in Constants.js only |
| `src/npcs/BuilderNPC.js` | **New** (replaces CTOnpc, id: `'builder'`) |
| `src/npcs/CTOnpc.js` | **Delete** |
| `src/npcs/InvestorNPC.js` | **Delete** |
| `src/npcs/CommunityNPC.js` | **Delete** |
| `src/npcs/SpeechBubble.js` | **New** — Three.js Sprite speech bubble |
| `src/ui/DialogueModal.js` | **Delete** |
| `src/data/dialogues.js` | **Update** — remove cto/investor/community, add builder dialogue bank |
| `src/physics/KnockableObjects.js` | **Rewrite** — full object set (footballs, cones, boxes, boots, trophy) |
| `src/utils/Constants.js` | **Update** — 3 zones, new NPC positions, day/night values |
| `index.html` | **Update** — remove modal HTML, remove matchday button |

---

## Out of Scope

- Mobile controls (existing stub stays)
- Real Claude API integration (mock dialogue retained)
- Backend / contact form
- Sound design changes
- Camera system changes (already improved)
- Physics engine changes (already improved)
