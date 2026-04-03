// src/main.js
import './style.css'
import { initBackgroundCanvas, updateBackgroundCanvas } from './canvas/BackgroundCanvas.js'
import { initCursor }       from './cursor/Cursor.js'
import { initSmoothScroll } from './scroll/SmoothScroll.js'
import { initAnimations }   from './scroll/Animations.js'
import { initHeroLogo }     from './hero/HeroLogo.js'
import { initHero }         from './sections/hero.js'
import { initAbout }        from './sections/about.js'
import { initMdfld }        from './sections/mdfld.js'
import { initProjects }     from './sections/projects.js'
import { initActivity }     from './sections/activity.js'
import { initContact }      from './sections/contact.js'
import bakedData            from './data/github-activity.json'

initBackgroundCanvas()
initCursor()
initSmoothScroll()
initAnimations()
initHero()
initAbout()
initMdfld()
initProjects()
initActivity(bakedData)
initContact()

// Silently refresh activity data from live API
fetch('/api/github')
  .then(r => r.ok ? r.json() : null)
  .then(liveData => {
    if (liveData && liveData.totalContributions !== bakedData.totalContributions) {
      initActivity(liveData)
    }
  })
  .catch(() => { /* live refresh is best-effort */ })

const heroLogo = initHeroLogo()

function loop(ts) {
  updateBackgroundCanvas(ts)
  heroLogo?.animate(ts)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
