import * as THREE from 'three'
import { buildBillboard } from './billboardBuilder.js'

export class WhoIAmZone {
  build(scene) {
    buildBillboard(scene, {
      color: '#ffd700',
      lines: [
        { text: 'AYOOLA MORAKINYO',        size: 32, bold: true,  color: '#ffd700' },
        { text: 'Founder · Builder · Atlanta, GA', size: 18, bold: false, color: 'rgba(255,255,255,0.7)' },
        { text: '',                         size: 12 },
        { text: 'Masters student. Former athlete.', size: 20, bold: false, color: '#ffffff' },
        { text: 'Building the authentication layer', size: 20, bold: false, color: '#ffffff' },
        { text: 'for the sneaker economy.',  size: 20, bold: false, color: '#ffffff' },
        { text: '',                         size: 12 },
        { text: "When I'm not training ML models", size: 17, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: "I'm on the pitch. This stadium is both.", size: 17, bold: false, color: 'rgba(255,255,255,0.6)' },
      ],
      position: [0, 0, -45],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
