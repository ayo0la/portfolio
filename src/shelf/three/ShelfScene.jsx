import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PROJECTS } from '../projects.js'
import { clampPan, panFor } from './layout.js'
import { nearestIndex, NUDGE } from '../panIndex.js'
import { MOTION, entryDelay } from '../motion.js'
import { approach, RATES, settled } from './easing.js'
import { Room } from './Room.jsx'
import { Record } from './Record.jsx'
import { Focus } from './Focus.jsx'

// Camera rig: fixed on desktop; on phones it pans along the single row.
function CameraRig({ layout, panRef, touchedRef, onIndex }) {
  const { camera, gl, size, invalidate } = useThree()

  useEffect(() => {
    camera.fov = layout.camera.fov
    camera.updateProjectionMatrix()
    panRef.current.target = clampPan(panRef.current.target, layout)
    invalidate()
  }, [camera, layout, panRef, invalidate])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const p = panRef.current
    p.x = approach(p.x, p.target, RATES.pan, dt)
    if (settled(p.x, p.target)) p.x = p.target; else invalidate()
    const [, cy, cz] = layout.camera.position
    camera.position.set(p.x, cy, cz)
    camera.lookAt(p.x, layout.camera.lookAt[1], layout.camera.lookAt[2])
    if (layout.mode === 'phone') onIndex?.(nearestIndex(p.x, layout, PROJECTS.length))
  }, -2)

  // swipe along the row
  useEffect(() => {
    if (layout.mode !== 'phone') return undefined
    const el = gl.domElement
    let drag = null
    const down = (e) => { touchedRef.current = true; drag = { x: e.clientX, start: panRef.current.target, id: e.pointerId } }
    const move = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dist = layout.camera.position[2] - 0.2
      const worldPerPx = (2 * Math.tan((layout.camera.fov * Math.PI) / 360) * dist * (size.width / size.height)) / size.width
      panRef.current.target = clampPan(drag.start - (e.clientX - drag.x) * worldPerPx, layout)
      invalidate()
    }
    const up = () => { drag = null }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [gl, layout, size.width, size.height, panRef, touchedRef, invalidate])

  return null
}

export function ShelfScene({ state, dispatch, hoverSlug, setHover, kbFocus, data, layout, visible, entered, onDay, onFace, panRequest, onIndex }) {
  const roomRef = useRef(null)
  const panRef = useRef({ x: 0, target: 0 })
  const invalidate = useThree((s) => s.invalidate)
  const started = useRef(false)
  const touched = useRef(false)

  // dot taps from the HTML indicator
  useEffect(() => {
    if (!panRequest || layout.mode !== 'phone') return
    touched.current = true
    panRef.current.target = panFor(panRequest.index, layout)
    invalidate()
  }, [panRequest, layout, panRef, invalidate])

  // one-time nudge once the records have settled: pan a third of the way to the next record and
  // spring back, so the motion itself says the shelf scrolls sideways
  const nudged = useRef(false)
  const anyOpenNow = state.open !== null
  useEffect(() => {
    if (layout.mode !== 'phone' || !entered || nudged.current || anyOpenNow) return undefined
    const settle = (entryDelay(PROJECTS.length - 1) + MOTION.entryDuration * 1.5 + 0.3) * 1000
    let back
    const go = setTimeout(() => {
      if (touched.current || nudged.current) return
      nudged.current = true
      const base = panRef.current.target
      panRef.current.target = clampPan(base + NUDGE.fraction * layout.gap, layout)
      invalidate()
      back = setTimeout(() => {
        if (touched.current) return
        panRef.current.target = base
        invalidate()
      }, NUDGE.out * 1000)
    }, settle)
    return () => { clearTimeout(go); clearTimeout(back) }
  }, [layout, entered, anyOpenNow, panRef, invalidate])

  // the open record brings the camera to it on phones
  useEffect(() => {
    if (layout.mode !== 'phone') { panRef.current.target = 0; return }
    const i = state.open ? PROJECTS.findIndex((p) => p.slug === state.open) : -1
    if (i >= 0) {
      panRef.current.target = panFor(i, layout)
      invalidate()
    } else if (!started.current) {
      // phones start on the first record, with the next one peeking in
      panRef.current.target = panRef.current.x = panFor(0, layout)
      invalidate()
    }
    started.current = true
  }, [state.open, layout, invalidate])

  // a paused canvas (frameloop 'never') is stale on return: draw once when it is visible again
  useEffect(() => { if (visible) invalidate() }, [visible, invalidate])

  const anyOpen = state.open !== null
  const shownHover = anyOpen ? null : hoverSlug

  return (
    <>
      <CameraRig layout={layout} panRef={panRef} touchedRef={touched} onIndex={onIndex} />
      <Room layout={layout} anyOpen={anyOpen} roomRef={roomRef} onDay={onDay} />
      {PROJECTS.map((project, index) => (
        <Record
          key={project.slug}
          project={project}
          index={index}
          layout={layout}
          roomRef={roomRef}
          panRef={panRef}
          data={data}
          isOpen={state.open === project.slug}
          isFlipped={state.flipped}
          isHover={shownHover === project.slug}
          isGlow={kbFocus === project.slug && !anyOpen}
          anyOpen={anyOpen}
          entered={entered}
          onFace={onFace}
          onHover={(slug, leaving) => setHover((cur) => (slug === null ? (cur === leaving ? null : cur) : slug))}
          onSelect={(slug) => { if (state.open !== slug) dispatch({ type: 'open', slug }) }}
        />
      ))}
      <Focus layout={layout} active={anyOpen} />
    </>
  )
}
