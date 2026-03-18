// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor } from './cursor/Cursor.js'

initBackgroundCanvas()
initCursor()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
