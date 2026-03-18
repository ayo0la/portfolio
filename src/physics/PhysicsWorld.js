/**
 * PhysicsWorld — thin wrapper around a Rapier World instance.
 * Import RAPIER (already init'd) and call initPhysics(RAPIER).
 */
import { PHYSICS } from '../utils/Constants.js'

let worldRef = null

export function initPhysics(RAPIER) {
  const gravity = new RAPIER.Vector3(0, PHYSICS.GRAVITY, 0)
  const world = new RAPIER.World(gravity)
  world.timestep = PHYSICS.TIMESTEP
  worldRef = world
  return world
}

export function getWorld() { return worldRef }
