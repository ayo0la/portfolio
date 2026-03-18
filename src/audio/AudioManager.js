/**
 * AudioManager — Web Audio API synthesised sounds (no external files).
 * All sounds are generated procedurally using OscillatorNode and BufferSourceNode.
 */

let ctx = null
let masterGain = null
let crowdNode = null
let crowdGain = null
let initialized = false

export function initAudio() {
  // Must be called after user interaction (browser autoplay policy)
  if (initialized) return
  initialized = true

  ctx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ctx.createGain()
  masterGain.gain.value = 0.55
  masterGain.connect(ctx.destination)

  startCrowdAmbience()
}

export function destroyAudio() {
  if (!initialized) return
  try {
    crowdNode?.stop()
    crowdNode?.disconnect()
    crowdGain?.disconnect()
    masterGain?.disconnect()
    ctx?.close()
  } catch (_) {}
  ctx = null
  masterGain = null
  crowdNode = null
  crowdGain = null
  initialized = false
}

// ── Crowd ambience (looping filtered noise) ─────────────────────
function startCrowdAmbience() {
  if (!ctx) return

  const bufferSize = ctx.sampleRate * 3
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

  crowdNode = ctx.createBufferSource()
  crowdNode.buffer = buffer
  crowdNode.loop = true

  // Low-pass filter — crowd murmur
  const lpf = ctx.createBiquadFilter()
  lpf.type = 'lowpass'
  lpf.frequency.value = 420
  lpf.Q.value = 1.2

  // High-pass to remove rumble
  const hpf = ctx.createBiquadFilter()
  hpf.type = 'highpass'
  hpf.frequency.value = 85

  crowdGain = ctx.createGain()
  crowdGain.gain.value = 0.18

  crowdNode.connect(lpf)
  lpf.connect(hpf)
  hpf.connect(crowdGain)
  crowdGain.connect(masterGain)
  crowdNode.start()
}

// ── Zone entry sound (gentle chord) ────────────────────────────
export function playZoneSound(zoneId) {
  if (!ctx) return
  const freqs = [220, 277.18, 329.63]  // A3, C#4, E4 — major chord
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(ctx.currentTime + i * 0.05)
    osc.stop(ctx.currentTime + 1.4)
  })
}

// ── UI interaction sound ────────────────────────────────────────
export function playUISound(type = 'click') {
  if (!ctx) return

  if (type === 'interact') {
    // Ascending sweep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain); gain.connect(masterGain)
    osc.start(); osc.stop(ctx.currentTime + 0.28)
    return
  }

  if (type === 'close') {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.connect(gain); gain.connect(masterGain)
    osc.start(); osc.stop(ctx.currentTime + 0.22)
    return
  }

  // Default click
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 800
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
  osc.connect(gain); gain.connect(masterGain)
  osc.start(); osc.stop(ctx.currentTime + 0.07)
}

// ── Match Day fanfare ───────────────────────────────────────────
export function playMatchDayFanfare() {
  if (!ctx) return

  const pentatonic = [261.63, 293.66, 329.63, 392, 440, 523.25]
  pentatonic.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    const t = ctx.currentTime + i * 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.14, t + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    osc.connect(gain); gain.connect(masterGain)
    osc.start(t); osc.stop(t + 0.7)
  })

  // Boost crowd during match day
  if (crowdGain) {
    crowdGain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 1)
  }
}

export function resetCrowdVolume() {
  if (crowdGain && ctx) {
    crowdGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2)
  }
}

export function getAudioContext() { return ctx }
