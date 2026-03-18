// Mobile joystick is initialised by MobileControls.js via DOM manipulation.
// This module only exports a helper for showing/hiding.

export function showJoystick() {
  document.getElementById('mobile-joystick')?.classList.add('visible')
}

export function hideJoystick() {
  document.getElementById('mobile-joystick')?.classList.remove('visible')
}
