import { useMemo } from 'react'
import { faceQuad, quadMatrix3d } from '../three/layout.js'
import { BackFace } from './BackFace.jsx'
import { ChessOverlay } from './ChessOverlay.jsx'

export const FACE_PX = 400

// HTML laid over the open record: the back face when flipped, the playable board on the Chess
// Rivals front. A 400px element is warped onto the record's projected face with one matrix3d,
// so it matches the WebGL pose in perspective without relying on CSS 3D scenes.
export function FaceLayer({ project, flipped, layout, size, panX, ready = true, downloads, upstream }) {
  const showChess = project.slug === 'chess-rivals' && !flipped
  const quad = useMemo(
    () => faceQuad(layout, size, { flipped, panX }),
    [layout, size, flipped, panX],
  )
  if (!flipped && !showChess) return null
  const m = quadMatrix3d(quad, FACE_PX, FACE_PX)
  return (
    <div
      className={`shelf-face${ready ? ' is-ready' : ''}`}
      key={`${project.slug}:${flipped ? 'back' : 'front'}`}
      style={{ width: FACE_PX, height: FACE_PX, transform: `matrix3d(${m.join(',')})` }}
    >
      {flipped ? <BackFace project={project} downloads={downloads} upstream={upstream} /> : <ChessOverlay />}
    </div>
  )
}
