import * as THREE from 'three'
import { LIGHTS } from '../utils/Constants.js'

let _lights = null   // { ambient, sun, floods[], hemi, skyUniforms, sunMeshes[] }
let _scene  = null
let _dayProgress = 0

const _dayTopColor       = new THREE.Color(0x4a90d9)
const _nightTopColor     = new THREE.Color(0x020510)
const _dayHorizonColor   = new THREE.Color(0x87ceeb)
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
