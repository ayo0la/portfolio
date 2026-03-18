import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class AyoolaNPC extends NPCBase {
  constructor() {
    const d = NPCS.ayoola
    super({ ...d, emoji: '🧠' })
  }
}
