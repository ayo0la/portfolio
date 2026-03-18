// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor }       from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations }   from './scroll/Animations.js'
import { initHero }         from './sections/hero.js'
import { initAbout }        from './sections/about.js'
import { initMdfld }        from './sections/mdfld.js'
import { initProjects }     from './sections/projects.js'
import { initContact }      from './sections/contact.js'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()
initHero()
initAbout()
initMdfld()
initProjects()
initContact()

function loop(ts) {
  updateBackgroundCanvas(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
