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
