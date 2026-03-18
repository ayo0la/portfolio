import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class CTOnpc extends NPCBase {
  constructor() {
    const d = NPCS.cto
    super({ ...d, emoji: '⚙️' })
  }
}
