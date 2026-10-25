import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Euler, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useCoverTexture } from './useCoverTexture.js'
import { homePose, openTarget } from './layout.js'
import { approach, RATES, settled } from './easing.js'
import { poseChanged, repaintDue, mergeSleeveGroups } from '../perf.js'
import { faceReady, MOTION, entryDelay, entryDone, entrySpring, stepSpring } from '../motion.js'

const ENTRY_DROP = 0.05 // world units a record falls onto the shelf
const ENTRY_ROCK = 0.2 // radians it rocks forward from before settling into its lean
const DIM_OPEN = 0.28
const EMISSIVE_OPEN_DIM = 0.12
const GLOW = new Color('#e8b931')
const NO_GLOW = new Color('#000000')

let sharedGeo = null
const recordGeo = () => (sharedGeo ??= mergeSleeveGroups(new RoundedBoxGeometry(1, 1, 0.03, 2, 0.006)))

const tmpPos = new Vector3()
const targetPos = new Vector3()
const homeQ = new Quaternion()
const openQ = new Quaternion()
const eul = new Euler()
const tint = new Color()

export function Record({
  project, index, layout, roomRef, panRef, data,
  isOpen, isFlipped, isHover, isGlow, anyOpen, entered, onFace, onHover, onSelect,
}) {
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const group = useRef()
  const lastPose = useRef(null)
  const lastPaint = useRef(null)
  const tick = useRef(0)
  const cover = useCoverTexture(project, data)
  const anim = useRef({
    hover: 0, open: { x: 0, v: 0 }, flip: 0, t: 0, playing: false, dim: null, emis: null, glow: 0,
    entryT: 0, delay: 0, face: '',
  })
  const prevAny = useRef(anyOpen)

  const home = useMemo(() => homePose(index, layout.mode), [index, layout.mode])

  const mats = useMemo(() => {
    const sleeve = new MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.7, emissive: '#000000' })
    const front = new MeshStandardMaterial({
      map: cover.texture,
      emissiveMap: cover.texture,
      emissive: '#ffffff',
      emissiveIntensity: 0.55,
      roughness: 0.92,
      metalness: 0,
      envMapIntensity: 0.15,
      toneMapped: false,
    })
    const list = [sleeve, front] // two draw calls per pass (see mergeSleeveGroups)
    return { sleeve, front, list }
  }, [cover.texture])

  useEffect(() => () => { mats.sleeve.dispose(); mats.front.dispose() }, [mats])
  useEffect(() => () => clearTimeout(tick.current), [])

  // first row: fetch and decode the full-length screenshots at idle time once the shelf has
  // entered, so the first hover does not pay for it
  useEffect(() => {
    if (!entered || index >= layout.perRow) return undefined
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => cover.wantFull(), { timeout: 3000 })
    return () => cancel(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered, index, layout.perRow])

  const playing = isHover || isOpen
  useEffect(() => { invalidate() }, [isOpen, isFlipped, isHover, isGlow, anyOpen, entered, layout, home, invalidate])

  // next/prev: the incoming record starts once the outgoing one is nextOverlap from done
  useEffect(() => {
    if (isOpen && prevAny.current) anim.current.delay = Math.max(0, MOTION.closeDuration - MOTION.nextOverlap)
    prevAny.current = anyOpen
  }, [isOpen, anyOpen])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const a = anim.current
    const room = roomRef.current
    if (!room || !group.current) return
    let moving = false

    // entry: nothing shows until the section is first seen, then records settle left to right
    if (!entered) { group.current.visible = false; return }
    if (!entryDone(index, a.entryT)) { a.entryT += dt; moving = true }
    const entry = entrySpring(a.entryT - entryDelay(index))
    group.current.visible = a.entryT >= entryDelay(index)

    // hover tip and open slide (open springs past rest, close eases without overshoot)
    const wantO = isOpen ? 1 : 0
    const wantH = isHover ? 1 : 0
    a.hover = approach(a.hover, wantH, wantH ? RATES.hoverIn : RATES.hoverOut, dt)
    if (settled(a.hover, wantH)) a.hover = wantH; else moving = true
    const o = a.open
    if (wantO && a.delay > 0) {
      a.delay -= dt
      moving = true
    } else if (wantO) {
      stepSpring(o, 1, dt)
      if (Math.abs(o.x - 1) < 0.002 && Math.abs(o.v) < 0.01) { o.x = 1; o.v = 0 } else moving = true
    } else {
      a.delay = 0
      o.v = 0
      o.x = approach(o.x, 0, RATES.openOut, dt)
      if (settled(o.x, 0)) o.x = 0; else moving = true
    }
    const wantF = isOpen && isFlipped ? 1 : 0
    a.flip = approach(a.flip, wantF, RATES.flip, dt)
    if (settled(a.flip, wantF)) a.flip = wantF; else moving = true

    // living cover: repaint at 30 Hz while hovered or open. Nothing else is moving for it, so a
    // timer wakes the demand loop for the next paint instead of spinning at display rate.
    if (playing) {
      if (!a.playing) { a.playing = true; a.t = 0; lastPaint.current = null; cover.wantFull() }
      const now = performance.now() / 1000
      if (repaintDue(lastPaint.current, now)) {
        a.t += lastPaint.current === null ? 0 : Math.min(now - lastPaint.current, 0.1)
        lastPaint.current = now
        cover.paint({ t: a.t, playing: true })
      }
      clearTimeout(tick.current)
      tick.current = setTimeout(invalidate, 1000 / 30)
    } else if (a.playing) {
      a.playing = false
      a.t = 0
      lastPaint.current = null
      clearTimeout(tick.current)
      cover.paint({ t: 0, playing: false })
      moving = true
    }

    // pose
    eul.set(home.rotation[0] + MOTION.hoverTipRad * a.hover + ENTRY_ROCK * (1 - entry), home.rotation[1], 0)
    homeQ.setFromEuler(eul)
    tmpPos.set(
      home.position[0],
      home.position[1] + 0.03 * a.hover + ENTRY_DROP * Math.max(0, 1 - entry), // only the rock may overshoot
      home.position[2] + 0.12 * a.hover,
    )
    // phones: the open record rides the live camera, so a pan or swipe never leaves it behind
    const pan = panRef.current
    const flipE = a.flip // exponential approach: already an ease-out, within 1% of the target at flipDuration
    const target = openTarget(layout, flipE, pan.x)
    targetPos.set(...target.position)
    eul.set(0, target.rotationY, 0)
    openQ.setFromEuler(eul)
    const ke = o.x
    group.current.position.lerpVectors(tmpPos, targetPos, ke)
    group.current.quaternion.slerpQuaternions(homeQ, openQ, ke)
    group.current.scale.setScalar(layout.recordSize * (1 + (layout.openScale - 1) * ke))

    // shadow maps are static; refresh them only when this record actually moved
    const gp = group.current.position
    const gq = group.current.quaternion
    const pose = [gp.x, gp.y, gp.z, gq.x, gq.y, gq.z, gq.w, group.current.scale.x, group.current.visible ? 1 : 0]
    if (poseChanged(lastPose.current, pose)) {
      lastPose.current = pose
      gl.shadowMap.needsUpdate = true
    }

    // dim the others while one is open; blend with the day/night cover light
    const dimmed = anyOpen && !isOpen
    const wantDim = (dimmed ? DIM_OPEN : 1) * room.coverDiffuse
    const wantEmis = dimmed ? EMISSIVE_OPEN_DIM : room.coverEmissive
    if (a.dim === null) { a.dim = wantDim; a.emis = wantEmis }
    a.dim = approach(a.dim, wantDim, RATES.dim, dt)
    a.emis = approach(a.emis, wantEmis, RATES.dim, dt)
    if (!settled(a.dim, wantDim) || !settled(a.emis, wantEmis)) moving = true
    mats.front.color.setScalar(a.dim)
    mats.front.emissiveIntensity = a.emis

    // gold edge glow for keyboard focus
    const wantGlow = isGlow ? 1 : 0
    a.glow = approach(a.glow, wantGlow, RATES.dim, dt)
    if (!settled(a.glow, wantGlow)) moving = true
    tint.copy(NO_GLOW).lerp(GLOW, a.glow * 0.8)
    mats.sleeve.emissive.copy(tint)
    mats.sleeve.color.set('#1a1a1a').lerp(GLOW, a.glow * 0.35)

    // the HTML face may show only once this record and the camera sit on the pose it is warped to
    const faceKey = isOpen ? `${project.slug}|${isFlipped}|${pan.x}` : ''
    const ready = faceReady({
      isOpen, delay: a.delay, open: o, flip: flipE, wantFlip: wantF, panSettled: settled(pan.x, pan.target),
    })
    const report = ready ? faceKey : isOpen ? `${project.slug}|${isFlipped}|off` : ''
    if (report !== a.face) {
      a.face = report
      // closing clears the shared face state so a reopen never starts from a stale ready pose
      onFace?.(isOpen ? { slug: project.slug, flipped: isFlipped, ready, panX: pan.x } : null)
    }

    if (moving) invalidate()
  }, -0.5)

  return (
    <group ref={group}>
      <mesh
        geometry={recordGeo()}
        material={mats.list}
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          if (e.pointerType !== 'mouse') return
          e.stopPropagation()
          onHover(project.slug)
        }}
        onPointerOut={() => onHover(null, project.slug)}
        onClick={(e) => {
          if (e.delta > 6) return
          e.stopPropagation()
          onSelect(project.slug)
        }}
      />
    </group>
  )
}
