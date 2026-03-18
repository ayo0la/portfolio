// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'

initBackgroundCanvas()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
