const screen  = document.getElementById('loading-screen')
const bar     = document.getElementById('loading-bar')
const status  = document.getElementById('loading-status')

const STEPS = [
  'Laying the turf…',
  'Raising the stands…',
  'Powering the floodlights…',
  'Positioning NPCs…',
  'Loading the archive…',
  'Tuning the crowd…',
  'Match day ready.',
]

let step = 0

export function updateLoadingProgress(pct) {
  if (bar) bar.style.width = pct + '%'
  const idx = Math.min(Math.floor(pct / (100 / STEPS.length)), STEPS.length - 1)
  if (idx !== step && status) {
    step = idx
    status.textContent = STEPS[step]
  }
}

export function hideLoadingScreen() {
  if (!screen) return
  updateLoadingProgress(100)
  setTimeout(() => screen.classList.add('hidden'), 400)
}
