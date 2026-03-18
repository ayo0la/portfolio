import { EventBus } from '../utils/EventBus.js'

const fpsEl = document.getElementById('fps-counter')

export function initHUD() {
  // zone:enter / zone:exit handled by in-world billboards — no HUD label needed
  // hud:prompt handled by speech bubbles — no HUD prompt needed
}

export function updateFPS(fps) {
  if (fpsEl) fpsEl.textContent = `${Math.round(fps)} FPS`
}
