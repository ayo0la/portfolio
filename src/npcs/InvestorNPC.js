import { NPCBase } from './NPCBase.js'
import { NPCS } from '../utils/Constants.js'

export class InvestorNPC extends NPCBase {
  constructor() {
    const d = NPCS.investor
    super({ ...d, emoji: '📈' })
  }
}
