import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'

// Scene
import { initScene }                            from './scene/SceneManager.js'
import { buildSky }                             from './scene/Sky.js'
import { buildPitch }                           from './scene/Pitch.js'
import { buildStadium }                         from './scene/Stadium.js'
import { buildFloodlights }                     from './scene/Floodlights.js'
import { buildPitchAtmosphere }                 from './scene/PitchAtmosphere.js'
import { initMatchDayMode, toggleMatchDay,
         updateMatchDay }                        from './scene/MatchDayMode.js'
import { createCarMesh, updateCarMesh }          from './scene/CarMesh.js'
import { updateCameraRig, snapCamera }           from './scene/CameraRig.js'

// Physics
import { initPhysics }                           from './physics/PhysicsWorld.js'
import { buildStadiumColliders }                 from './physics/StadiumColliders.js'
import { createVehicle, applyVehicleInput,
         getVehicle, getChassisBody }            from './physics/VehiclePhysics.js'
import { initKnockables, syncKnockables,
         resetKnockables }                       from './physics/KnockableObjects.js'

// Controls
import { initDesktop, getCarInput }              from './controls/DesktopControls.js'

// Zones / NPCs
import { initZones, updateZones }                from './zones/ZoneManager.js'
import { initNPCs, updateNPCs }                  from './npcs/NPCManager.js'

// Audio
import { initAudio, playZoneSound, playUISound,
         playMatchDayFanfare, resetCrowdVolume }  from './audio/AudioManager.js'

// UI
import { initHUD, updateFPS }                    from './ui/HUD.js'
import { updateLoadingProgress, hideLoadingScreen } from './ui/LoadingScreen.js'

// Utils
import { EventBus }                              from './utils/EventBus.js'
import { initDayNight, updateDayNight }          from './scene/DayNightCycle.js'

// ── Init ────────────────────────────────────────────────────────

function showFatalError(msg) {
  const el = document.getElementById('loading-screen')
  if (el) {
    el.style.opacity = '1'
    el.style.pointerEvents = 'all'
    el.innerHTML = `
      <div style="text-align:center;padding:2rem;font-family:'Inter',sans-serif">
        <div style="font-size:2rem;color:#ffd700;margin-bottom:1rem">⚠ Failed to load</div>
        <div style="color:rgba(255,255,255,0.6);font-size:0.9rem;max-width:400px">${msg}</div>
        <button onclick="location.reload()" style="margin-top:2rem;padding:0.6rem 1.6rem;background:#ffd700;border:none;border-radius:4px;cursor:pointer;font-weight:600">Reload</button>
      </div>`
  }
}

try {
  await RAPIER.init()
} catch (e) {
  showFatalError('Physics engine failed to initialise. Try a modern Chromium browser.')
  throw e
}

const { scene, camera, renderer, clock } = initScene()

// ── Load step helper ────────────────────────────────────────────

let loadStep = 0
const TOTAL_STEPS = 9
function progress() {
  loadStep++
  updateLoadingProgress((loadStep / TOTAL_STEPS) * 95)
}

// ── Build visual world ──────────────────────────────────────────

try {
  progress(); const { skyUniforms, sunMeshes } = buildSky(scene)
  progress(); buildPitch(scene)
  buildPitchAtmosphere(scene)
  progress(); buildStadium(scene)
  progress(); const { floodlights, ambientLight, sunLight, hemiLight } = buildFloodlights(scene)
  progress(); initZones(scene)
  progress(); initNPCs(scene)
  initDayNight(scene, { ambient: ambientLight, sun: sunLight, floods: floodlights, skyUniforms, sunMeshes })
} catch (e) {
  showFatalError('Scene build failed: ' + e.message)
  throw e
}

// ── Build physics world ─────────────────────────────────────────

let world, vehicle, chassisBody
try {
  world = initPhysics(RAPIER)
  progress(); buildStadiumColliders(RAPIER, world)
  ;({ vehicle, chassisBody } = createVehicle(RAPIER, world))
  progress(); initKnockables(RAPIER, world, scene)
} catch (e) {
  showFatalError('Physics world build failed: ' + e.message)
  throw e
}

// ── Car visual ──────────────────────────────────────────────────

createCarMesh(scene)
progress()

// ── Controls ────────────────────────────────────────────────────

initDesktop(camera, renderer.domElement)

// ── Camera: snap to chase position ─────────────────────────────

snapCamera(camera, chassisBody)

// ── UI / match day ────────────────────────────────────────────

initHUD()
initMatchDayMode(scene, camera, floodlights)

// ── EventBus wiring ─────────────────────────────────────────────

EventBus.on('audio:zone', zoneId => playZoneSound(zoneId))
EventBus.on('audio:ui',   type   => playUISound(type))

// ── Match Day button ────────────────────────────────────────────

const matchdayBtn = document.getElementById('matchday-btn')
matchdayBtn?.addEventListener('click', () => {
  if (matchdayBtn.classList.contains('active')) {
    toggleMatchDay(null)
    resetCrowdVolume()
  } else {
    toggleMatchDay(null)
    playMatchDayFanfare()
  }
})

EventBus.on('matchday:start', () => matchdayBtn?.classList.add('active'))
EventBus.on('matchday:end',   () => matchdayBtn?.classList.remove('active'))

// ── Audio: lazy init on first interaction ───────────────────────

let audioStarted = false
function startAudio() {
  if (audioStarted) return
  audioStarted = true
  initAudio()
}
window.addEventListener('click',      startAudio, { once: true })
window.addEventListener('keydown',    startAudio, { once: true })
window.addEventListener('touchstart', startAudio, { once: true })

// ── Loading screen ──────────────────────────────────────────────

const _hideTimeout = setTimeout(() => hideLoadingScreen(), 5000)
document.fonts.ready.then(() => {
  clearTimeout(_hideTimeout)
  setTimeout(() => hideLoadingScreen(), 400)
})

// ── FPS counter state ───────────────────────────────────────────

let frameCount  = 0
let lastFPSTime = 0
let fps         = 60

// Reusable THREE.Vector3 for passing car position to zone/NPC systems
const _carPos = new THREE.Vector3()

// ── Animation loop ──────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate)

  const dt      = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()

  // ── Stage 0: Read input ───────────────────────────────────────
  const raw = getCarInput()
  const input = {
    forward: raw.forward,
    back:    raw.backward,
    left:    raw.left,
    right:   raw.right,
    brake:   raw.brake,
    boost:   raw.boost,
  }

  // ── Stage 1: Pre-physics vehicle input ───────────────────────
  applyVehicleInput(input, dt)

  // ── Stage 2: Physics step (once per frame) ───────────────────
  world.step()

  // ── Stage 3: Sync physics objects → Three.js meshes ──────────
  updateCarMesh(chassisBody, vehicle)
  syncKnockables()

  // ── Stage 4: Spring chase camera ─────────────────────────────
  const isBoosting = raw.boost && raw.forward
  updateCameraRig(camera, chassisBody, dt, isBoosting)

  // ── Stage 5: Zone + NPC proximity (use car position) ─────────
  const ct = chassisBody.translation()
  _carPos.set(ct.x, ct.y, ct.z)
  updateZones(_carPos)
  updateNPCs(dt, elapsed, _carPos)

  // ── Stage 6: Match Day cinematic ──────────────────────────────
  updateMatchDay(dt)

  // ── Stage 7: One-shot actions ─────────────────────────────────
  if (raw.reset) {
    resetKnockables()
    chassisBody.setTranslation({ x: 0, y: 1.2, z: 24 }, true)
    chassisBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    chassisBody.setLinvel({ x: 0, y: 0, z: 0 }, true)
    chassisBody.setAngvel({ x: 0, y: 0, z: 0 }, true)
    snapCamera(camera, chassisBody)
  }

  if (raw.matchDay) matchdayBtn?.click()

  // ── Stage 8: FPS counter (every 0.5 s) ────────────────────────
  frameCount++
  const fpsDelta = elapsed - lastFPSTime
  if (fpsDelta > 0.5) {
    fps = Math.round(frameCount / fpsDelta)
    lastFPSTime = elapsed
    frameCount  = 0
    updateFPS(fps)
  }

  // ── Stage 9: Render ───────────────────────────────────────────
  updateDayNight(elapsed)
  renderer.render(scene, camera)
}

animate()
