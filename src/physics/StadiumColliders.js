/**
 * StadiumColliders — invisible physics geometry matching the visual world.
 *
 * - Flat ground plane spanning the full pitch + concourse
 * - Pitch-side adboard walls (thin vertical cuboids)
 * - 8 stand base walls (approximating the curved bowl with 8 flat segments)
 * - Goal back walls (prevent the ball flying through)
 */

export function buildStadiumColliders(RAPIER, world) {
  function fixedBox(hx, hy, hz, tx, ty, tz, ry = 0) {
    let desc = RAPIER.RigidBodyDesc.fixed().setTranslation(tx, ty, tz)
    if (ry !== 0) {
      const q = new RAPIER.Quaternion(0, Math.sin(ry / 2), 0, Math.cos(ry / 2))
      desc = desc.setRotation(q)
    }
    const body = world.createRigidBody(desc)
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.6), body)
  }

  // ── Ground ────────────────────────────────────────────────────
  // Thick slab — gives vehicle controller a stable contact surface
  fixedBox(80, 0.5, 80, 0, -0.5, 0)

  // ── Pitch adboard walls (keeps car on pitch, just inside adboard line) ──
  // North/South long sides (z = ±36, full width)
  fixedBox(54, 1.5, 0.3,   0, 0.75,  36.5)
  fixedBox(54, 1.5, 0.3,   0, 0.75, -36.5)
  // East/West short sides (x = ±54.5, full depth)
  fixedBox(0.3, 1.5, 36, -54.5, 0.75, 0)
  fixedBox(0.3, 1.5, 36,  54.5, 0.75, 0)

  // ── Stadium bowl approximation — 8 flat wall segments ────────
  // These prevent the car escaping onto the concourse/seats.
  // The inner bowl starts at radius ~70.  We use 8 flat walls tangent to r=68.
  const bowlR = 68
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8
    const tx = Math.sin(angle) * bowlR
    const tz = Math.cos(angle) * bowlR
    // Each wall segment is 55 units wide, 4 tall, rotated to be tangent
    fixedBox(28, 4, 0.5, tx, 2, tz, angle)
  }

  // ── Goal back walls (box behind each goal net) ──────────────
  // Prevents ball from flying through; at x = ±(52.5 + 2.4)
  fixedBox(0.2, 3, 4, -(52.5 + 2.5), 1.5, 0)
  fixedBox(0.2, 3, 4,  (52.5 + 2.5), 1.5, 0)
}
