import { initDesktop, updateDesktop, getControls, syncFromCamera } from './DesktopControls.js'
import { initMobile, updateMobile } from './MobileControls.js'

export const isMobile = () =>
  'ontouchstart' in window || navigator.maxTouchPoints > 0

let mobile = false

export function initControls(camera, domElement) {
  mobile = isMobile()
  if (mobile) {
    initMobile(camera, domElement)
    document.getElementById('lock-overlay').classList.add('hidden')
  } else {
    initDesktop(camera, domElement)
    // Show lock overlay initially
    document.getElementById('lock-overlay').classList.remove('hidden')
  }
}

export function updateControls(delta) {
  if (mobile) updateMobile(delta)
  else updateDesktop(delta)
}

export function getDesktopControls() {
  return mobile ? null : getControls()
}

export function syncDesktopFromCamera() {
  if (!mobile) syncFromCamera()
}
