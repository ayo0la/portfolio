import * as THREE from 'three'
import { AyoolaNPC }  from './AyoolaNPC.js'
import { BuilderNPC } from './BuilderNPC.js'
import { EventBus }   from '../utils/EventBus.js'
import { PLAYER }     from '../utils/Constants.js'

let npcs = []
let nearbyNPC = null

export function initNPCs(scene) {
  npcs = [new AyoolaNPC(), new BuilderNPC()]
  npcs.forEach(npc => npc.build(scene))
}

export function updateNPCs(delta, elapsed, carPos) {
  const prevNearby = nearbyNPC
  nearbyNPC = null

  npcs.forEach(npc => {
    npc.update(elapsed, delta)

    const dist = carPos.distanceTo(
      new THREE.Vector3(npc.group.position.x, carPos.y, npc.group.position.z)
    )

    if (dist < PLAYER.NPC_INTERACT_DISTANCE) {
      nearbyNPC = npc
      npc.lookAt(carPos)
    }
  })

  // Show bubble when entering range, hide when leaving
  if (nearbyNPC !== prevNearby) {
    if (prevNearby) prevNearby.bubble?.hide()
    if (nearbyNPC)  nearbyNPC.bubble?.show()
  }

  // Clear old E-key HUD prompt — no interaction required in new design
  EventBus.emit('hud:prompt:clear')
}
