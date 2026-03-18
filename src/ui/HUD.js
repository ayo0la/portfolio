import { EventBus } from '../utils/EventBus.js'

const zoneEl    = document.getElementById('hud-zone')
const promptEl  = document.getElementById('hud-prompt')
const fpsEl     = document.getElementById('fps-counter')

let zoneTimeout = null
let promptTimeout = null

export function initHUD() {
  EventBus.on('zone:enter', (zoneId, label) => showZone(label))
  EventBus.on('zone:exit',  () => hideZone())
  EventBus.on('hud:prompt', (html) => showPrompt(html))
  EventBus.on('hud:prompt:clear', () => hidePrompt())
}

export function updateFPS(fps) {
  if (fpsEl) fpsEl.textContent = `${Math.round(fps)} FPS`
}

function showZone(label) {
  if (!zoneEl) return
  zoneEl.textContent = label
  zoneEl.classList.add('visible')
  clearTimeout(zoneTimeout)
}

function hideZone() {
  if (!zoneEl) return
  clearTimeout(zoneTimeout)
  zoneTimeout = setTimeout(() => zoneEl.classList.remove('visible'), 600)
}

function showPrompt(html) {
  if (!promptEl) return
  promptEl.innerHTML = html
  promptEl.classList.add('visible')
  clearTimeout(promptTimeout)
}

function hidePrompt() {
  if (!promptEl) return
  clearTimeout(promptTimeout)
  promptTimeout = setTimeout(() => promptEl.classList.remove('visible'), 200)
}
