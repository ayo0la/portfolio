import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'

const BOKEH_SCALE = 3

// Pulls focus onto the open record on desktop. Phones skip post-processing entirely: the
// records and wall dim instead (see Record.jsx and Room.jsx), which costs nothing.
// The composer is mounted only while a record is open. Keeping it mounted with enabled={false}
// was tried and rejected: the composer forces gl.toneMapping to none for as long as it is mounted,
// which changed the closed shelf's look (mean 5% brighter) and costs a shader recompile anyway.
// Next/prev while open does not remount (active stays true).
export function Focus({ layout, active }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { invalidate() }, [active, invalidate])
  if (layout.mode !== 'desktop' || !active) return null

  const [cx, cy, cz] = layout.camera.position
  const [ox, oy, oz] = layout.openPose.position
  const centreY = oy + (layout.recordSize * layout.openScale) / 2
  const distance = Math.hypot(ox - cx, centreY - cy, oz - cz)
  return (
    <EffectComposer multisampling={0}>
      <DepthOfField resolutionScale={0.4} worldFocusDistance={distance} worldFocusRange={1.4} bokehScale={BOKEH_SCALE} />
    </EffectComposer>
  )
}
