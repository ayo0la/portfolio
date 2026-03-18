import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class CommunityNPC extends NPCBase {
  constructor() {
    const d = NPCS.community
    super({ ...d, emoji: '⚽' })
  }
}
