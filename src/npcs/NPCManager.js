import * as THREE from 'three'
import { AyoolaNPC } from './AyoolaNPC.js'
import { CTOnpc } from './CTOnpc.js'
import { InvestorNPC } from './InvestorNPC.js'
import { CommunityNPC } from './CommunityNPC.js'
import { EventBus } from '../utils/EventBus.js'
import { PLAYER } from '../utils/Constants.js'

const NPC_EMOJIS = { ayoola: '🧠', cto: '⚙️', investor: '📈', community: '⚽' }

let npcs = []
let nearbyNPC = null
let interactLocked = false

export function initNPCs(scene) {
  npcs = [
    new AyoolaNPC(),
    new CTOnpc(),
    new InvestorNPC(),
    new CommunityNPC(),
  ]
  npcs.forEach(npc => npc.build(scene))

  window.addEventListener('keydown', e => {
    if ((e.code === 'KeyE' || e.key === 'e') && nearbyNPC && !interactLocked) {
      triggerInteraction(nearbyNPC)
    }
  })
}

export function updateNPCs(delta, elapsed, cameraPos) {
  nearbyNPC = null

  npcs.forEach(npc => {
    npc.update(elapsed)

    const dist = cameraPos.distanceTo(
      new THREE.Vector3(npc.group.position.x, cameraPos.y, npc.group.position.z)
    )

    if (dist < PLAYER.NPC_INTERACT_DISTANCE) {
      nearbyNPC = npc
      npc.lookAt(cameraPos)
    }
  })

  // Update HUD prompt
  if (nearbyNPC) {
    EventBus.emit('hud:prompt', `<span class="key">E</span> Talk to ${nearbyNPC.label}`)
  } else {
    EventBus.emit('hud:prompt:clear')
  }
}

function triggerInteraction(npc) {
  interactLocked = true
  EventBus.emit('npc:interact', {
    id: npc.id,
    name: npc.label,
    role: npc.role,
    color: '#' + new THREE.Color(npc.color).getHexString(),
    emoji: NPC_EMOJIS[npc.id] || '👤',
  })
  EventBus.emit('audio:ui', 'interact')

  // Unlock after modal closes
  const unlock = () => {
    interactLocked = false
    EventBus.off('dialogue:close', unlock)
  }
  EventBus.on('dialogue:close', unlock)
}
