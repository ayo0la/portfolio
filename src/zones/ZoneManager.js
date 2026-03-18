import * as THREE from 'three'
import { EventBus } from '../utils/EventBus.js'
import { ZONES } from '../utils/Constants.js'

// Per-zone beacon colours
const BEACON_COLORS = {
  midfield:       0xffd700,
  tunnel:         0x00e5ff,
  lockerRoom:     0x00c853,
  transferMarket: 0xff6d00,
  expansionWing:  0xaa44ff,
  archive:        0x8ab4d4,
}

import { MidfieldCircle } from './MidfieldCircle.js'
import { BuilderTunnel } from './BuilderTunnel.js'
import { LockerRoom } from './LockerRoom.js'
import { TransferMarket } from './TransferMarket.js'
import { ExpansionWing } from './ExpansionWing.js'
import { TheArchive } from './TheArchive.js'

const zoneModules = {
  midfield:       MidfieldCircle,
  tunnel:         BuilderTunnel,
  lockerRoom:     LockerRoom,
  transferMarket: TransferMarket,
  expansionWing:  ExpansionWing,
  archive:        TheArchive,
}

const zones = []
let sceneRef = null

// Beacon meshes for pulsing in the update loop
const beacons = []

export function initZones(scene) {
  sceneRef = scene

  Object.entries(ZONES).forEach(([key, def]) => {
    const posVec = new THREE.Vector3(...def.position)
    zones.push({
      ...def,
      posVec,
      module: new zoneModules[key](),
      initialized: false,
      playerInside: false,
    })
    _buildBeacon(scene, key, def, posVec)
  })
}

function _buildBeacon(scene, key, def, pos) {
  const color = BEACON_COLORS[key] ?? 0xffffff
  const group = new THREE.Group()
  group.position.set(pos.x, 0, pos.z)

  // Vertical light column — tall thin cylinder, emissive so always visible
  const columnGeo = new THREE.CylinderGeometry(0.18, 0.35, 22, 8, 1, true)
  const columnMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const column = new THREE.Mesh(columnGeo, columnMat)
  column.position.y = 11
  group.add(column)

  // Top orb
  const orbGeo = new THREE.SphereGeometry(0.55, 10, 8)
  const orbMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
  const orb = new THREE.Mesh(orbGeo, orbMat)
  orb.position.y = 23
  group.add(orb)

  // Point light at orb position so it casts colour onto nearby geometry
  const ptLight = new THREE.PointLight(color, 1.5, 28)
  ptLight.position.y = 23
  group.add(ptLight)

  // Ground ring
  const ringGeo = new THREE.RingGeometry(def.radius - 0.5, def.radius, 48)
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.04
  group.add(ring)

  scene.add(group)
  beacons.push({ group, orb, column, ring, ringMat, columnMat, orbMat, ptLight })
}

export function updateZones(playerPos) {
  const t = Date.now() * 0.001

  zones.forEach((zone, i) => {
    const dist = playerPos.distanceTo(zone.posVec)
    const wasInside = zone.playerInside
    zone.playerInside = dist < zone.radius

    if (!wasInside && zone.playerInside) {
      // First entry — lazy init
      if (!zone.initialized) {
        if (typeof zone.module.build !== 'function') {
          console.warn(`[ZoneManager] Zone "${zone.id}" is missing a build() method — skipping init`)
        } else {
          zone.module.build(sceneRef)
        }
        zone.initialized = true
      }
      zone.module.onEnter?.()
      EventBus.emit('zone:enter', zone.id, zone.label)
    }

    if (wasInside && !zone.playerInside) {
      zone.module.onExit?.()
      EventBus.emit('zone:exit', zone.id)
    }

    if (zone.playerInside && zone.initialized) {
      zone.module.update?.(t)
    }

    // Animate beacon — fade out when inside, pulse when outside
    const b = beacons[i]
    if (b) {
      const inside = zone.playerInside
      const pulse = 0.5 + Math.sin(t * 1.6 + i) * 0.5  // 0..1
      b.columnMat.opacity = inside ? 0 : 0.08 + pulse * 0.12
      b.orbMat.opacity    = inside ? 0 : 0.55 + pulse * 0.35
      b.ringMat.opacity   = inside ? 0 : 0.06 + pulse * 0.10
      b.ptLight.intensity = inside ? 0 : 1.0 + pulse * 1.5
      b.orb.position.y    = 23 + Math.sin(t * 1.2 + i) * 0.4
    }
  })
}
