// Pure layout maths for the 3D room. Numbers come from the approved mockup.
export const BREAKPOINT = 700

const DESKTOP = {
  mode: 'desktop',
  rows: 2,
  perRow: 4,
  rowYs: [1.55, 0],
  recordSize: 1,
  gap: 1.3,
  shelfWidth: 5.6,
  camera: { position: [0, 2.0, 8.2], fov: 32, lookAt: [0, 0.85, 0] },
  openPose: { position: [1.25, 0.55, 3.9], rotationY: -0.18 },
  openScale: 1,
  flipLift: 0.5, // the flipped record steps toward the camera so the back face reads at full size
  flipDrop: 0,
  flipShiftX: -0.35, // and slides left a little so it clears the right edge
}

const PHONE = {
  mode: 'phone',
  rows: 1,
  perRow: 8,
  rowYs: [0],
  recordSize: 1.5,
  gap: 1.75,
  shelfWidth: 14.8,
  // A telephoto view: the open pose is fixed at z 9.4, so the camera sits far back and zooms
  // in to make a record about 60% of the phone canvas width. lookAt y is the record centre.
  camera: { position: [0, 1.05, 15], fov: 15, lookAt: [0, 1.05, 0] },
  openPose: { position: [0, 0.98, 9.4], rotationY: 0 },
  openScale: 0.4, // the open record lands in the upper half of the phone canvas
  // flipped, the record fills the canvas width so the back face stays readable; it drops to sit above the collapsed sheet
  flipLift: 1.7,
  flipDrop: 0.14,
  flipShiftX: 0,
}

export function layoutFor(width) {
  return width < BREAKPOINT ? PHONE : DESKTOP
}

const LAYOUTS = { desktop: DESKTOP, phone: PHONE }

// Hand-placed look: a fixed per-index lean and x jitter, same formulas as the mockup.
export function homePose(index, mode) {
  const l = LAYOUTS[mode] ?? DESKTOP
  const row = Math.floor(index / l.perRow)
  const col = index % l.perRow
  const lean = -(0.07 + ((index * 37) % 5) * 0.012)
  const jitter = (((index * 53) % 7) - 3) * 0.02
  const x = (col - (l.perRow - 1) / 2) * l.gap + jitter
  const z = 0.12 + Math.abs(Math.sin(lean)) * l.recordSize * 0.5
  const yaw = (((index * 29) % 5) - 2) * 0.012
  return { position: [x, l.rowYs[row], z], rotation: [lean, yaw, 0] }
}

// Phone swipe: the camera may centre on the first or last record, no further.
export function clampPan(x, layout) {
  if (layout.mode !== 'phone') return 0
  const limit = ((layout.perRow - 1) / 2) * layout.gap
  return Math.max(-limit, Math.min(limit, x))
}

// x where the camera centres on a record (phone only)
export function panFor(index, layout) {
  return layout.mode === 'phone' ? clampPan(homePose(index, 'phone').position[0], layout) : 0
}

// The open record's target pose at flip progress kf (0 front, 1 back). Record.jsx animates through
// this and faceQuad projects it, so the WebGL record and the HTML face share one definition.
export function openTarget(layout, kf = 0, panX = 0) {
  const op = layout.openPose
  return {
    position: [
      layout.mode === 'phone' ? panX : op.position[0] + layout.flipShiftX * kf,
      op.position[1] - layout.flipDrop * kf,
      op.position[2] + layout.flipLift * kf,
    ],
    rotationY: op.rotationY + Math.PI * kf,
  }
}

const FACE_Z = 0.0165 // half the record thickness plus a hair

// Where the open record's face lands on screen, as four canvas pixel points: top left, top
// right, bottom right, bottom left as the viewer sees them. flipped = the back face. The HTML
// face layer (back face, chess board) is warped onto this quad, so it never depends on CSS 3D.
export function faceQuad(layout, size, { flipped = false, panX = 0 } = {}) {
  const s = layout.recordSize * layout.openScale
  const t = openTarget(layout, flipped ? 1 : 0, panX)
  const [px, py, pz] = t.position
  const yaw = t.rotationY
  const camX = layout.mode === 'phone' ? panX : 0
  const eye = [camX, layout.camera.position[1], layout.camera.position[2]]
  const at = [camX, layout.camera.lookAt[1], layout.camera.lookAt[2]]

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const norm = (a) => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }
  const fwd = norm(sub(at, eye))
  const right = norm(cross(fwd, [0, 1, 0]))
  const up = cross(right, fwd)
  const tanHalf = Math.tan((layout.camera.fov * Math.PI) / 360)
  const aspect = size.width / size.height

  const project = (p) => {
    const d = sub(p, eye)
    const z = dot(d, fwd)
    return [
      ((dot(d, right) / (z * tanHalf * aspect)) * 0.5 + 0.5) * size.width,
      (0.5 - (dot(d, up) / (z * tanHalf)) * 0.5) * size.height,
    ]
  }
  // local corner -> world: scale, yaw about the vertical axis, translate
  const world = (lx, ly, lz) => {
    const x = lx * s
    const z = lz
    return [px + x * Math.cos(yaw) + z * Math.sin(yaw), py + ly * s, pz - x * Math.sin(yaw) + z * Math.cos(yaw)]
  }
  // the back face sits at -z and is seen mirrored, so the viewer's left is local +x
  const lz = flipped ? -FACE_Z : FACE_Z
  const l = flipped ? 0.5 : -0.5
  return [
    project(world(l, 1, lz)),
    project(world(-l, 1, lz)),
    project(world(-l, 0, lz)),
    project(world(l, 0, lz)),
  ]
}

// CSS matrix3d (column major, 16 numbers) that maps a w x h element, transform-origin 0 0,
// onto the quad (top left, top right, bottom right, bottom left) with true perspective.
export function quadMatrix3d(q, w, h) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const sx = x0 - x1 + x2 - x3
  const sy = y0 - y1 + y2 - y3
  let g = 0
  let hh = 0
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const dx1 = x1 - x2
    const dx2 = x3 - x2
    const dy1 = y1 - y2
    const dy2 = y3 - y2
    const det = dx1 * dy2 - dx2 * dy1
    g = (sx * dy2 - dx2 * sy) / det
    hh = (dx1 * sy - sx * dy1) / det
  }
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + hh * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + hh * y3
  return [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1]
}
