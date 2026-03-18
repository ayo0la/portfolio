/**
 * DesktopControls — pure input reader for the car-based experience.
 * No movement logic. Just tracks key state and exposes getCarInput().
 */

// Key state
const keys = {
  forward:  false,   // W / ArrowUp
  backward: false,   // S / ArrowDown
  left:     false,   // A / ArrowLeft
  right:    false,   // D / ArrowRight
  brake:    false,   // Space
  boost:    false,   // Shift
  interact: false,   // E  (consumed once per press)
  matchDay: false,   // M  (consumed once per press)
  reset:    false,   // R  (consumed once per press)
}

// One-shot flags: set on keydown, cleared after being read
let _interactConsumed = true
let _matchDayConsumed = true
let _resetConsumed    = true

export function initDesktop(_camera, _domElement) {
  // Hide pointer lock overlay — not needed with chase cam
  document.getElementById('lock-overlay')?.classList.add('hidden')

  window.addEventListener('keydown', _onKeyDown)
  window.addEventListener('keyup',   _onKeyUp)
}

function _onKeyDown(e) {
  switch (e.code) {
    case 'KeyW':        case 'ArrowUp':    keys.forward  = true;  break
    case 'KeyS':        case 'ArrowDown':  keys.backward = true;  break
    case 'KeyA':        case 'ArrowLeft':  keys.left     = true;  break
    case 'KeyD':        case 'ArrowRight': keys.right    = true;  break
    case 'Space':       e.preventDefault(); keys.brake   = true;  break
    case 'ShiftLeft':   case 'ShiftRight':  keys.boost   = true;  break
    case 'KeyE':
      if (_interactConsumed) { keys.interact = true; _interactConsumed = false }
      break
    case 'KeyM':
      if (_matchDayConsumed) { keys.matchDay = true; _matchDayConsumed = false }
      break
    case 'KeyR':
      if (_resetConsumed) { keys.reset = true; _resetConsumed = false }
      break
  }
}

function _onKeyUp(e) {
  switch (e.code) {
    case 'KeyW':        case 'ArrowUp':    keys.forward  = false; break
    case 'KeyS':        case 'ArrowDown':  keys.backward = false; break
    case 'KeyA':        case 'ArrowLeft':  keys.left     = false; break
    case 'KeyD':        case 'ArrowRight': keys.right    = false; break
    case 'Space':       keys.brake        = false; break
    case 'ShiftLeft':   case 'ShiftRight': keys.boost    = false; break
    case 'KeyE':        _interactConsumed = true;  break
    case 'KeyM':        _matchDayConsumed = true;  break
    case 'KeyR':        _resetConsumed    = true;  break
  }
}

/**
 * Returns the current car input state.
 * One-shot keys (interact, matchDay, reset) are auto-cleared after read.
 */
export function getCarInput() {
  const input = {
    forward:  keys.forward,
    backward: keys.backward,
    left:     keys.left,
    right:    keys.right,
    brake:    keys.brake,
    boost:    keys.boost,
    interact: keys.interact,
    matchDay: keys.matchDay,
    reset:    keys.reset,
  }
  // Clear one-shot keys
  keys.interact = false
  keys.matchDay = false
  keys.reset    = false
  return input
}

// Legacy stubs — kept so ControlsManager.js doesn't break
export function updateDesktop(_delta) {}
export function getControls()         { return null }
export function syncFromCamera()      {}
export function isLocked()            { return false }
