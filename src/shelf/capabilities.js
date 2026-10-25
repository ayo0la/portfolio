// Decides whether the visitor gets the 3D shelf or the plain HTML shelf.

export function shouldUse3D({ webgl, reducedMotion, saveData, deviceMemory, cores }) {
  if (!webgl || reducedMotion || saveData) return false
  if (deviceMemory !== undefined && deviceMemory < 4) return false
  if (cores !== undefined && cores < 4) return false
  return true
}

function probeWebgl(doc) {
  try {
    const canvas = doc.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    // hand the probe context back so it does not count against the page's context budget
    try { gl?.getExtension?.('WEBGL_lose_context')?.loseContext() } catch { /* already gone */ }
    return Boolean(gl)
  } catch {
    return false
  }
}

export function detectCapabilities(win = window) {
  const nav = win.navigator ?? {}
  return {
    webgl: probeWebgl(win.document),
    reducedMotion: Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
    saveData: Boolean(nav.connection?.saveData),
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
  }
}
