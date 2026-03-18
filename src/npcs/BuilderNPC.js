import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class BuilderNPC extends NPCBase {
  constructor() {
    const d = NPCS.builder
    super({ ...d, emoji: '⚙️' })
  }
}
