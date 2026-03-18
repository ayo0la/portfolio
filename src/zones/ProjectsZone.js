import * as THREE from 'three'
import { buildBillboard } from './billboardBuilder.js'

export class ProjectsZone {
  build(scene) {
    buildBillboard(scene, {
      color: '#00c853',
      lines: [
        { text: "WHAT I'VE BUILT",          size: 30, bold: true,  color: '#00c853' },
        { text: '',                           size: 10 },
        { text: 'MDFLD — Boot Verification', size: 22, bold: true,  color: '#ffffff' },
        { text: 'EfficientNet-B4 · 10k images · 99%+ target', size: 15, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: '',                           size: 8 },
        { text: 'Allstar Kids Academy',       size: 22, bold: true,  color: '#ffffff' },
        { text: 'Full-stack rebuild · ProCare API · enrollment', size: 15, bold: false, color: 'rgba(255,255,255,0.6)' },
        { text: '',                           size: 8 },
        { text: 'Boot Scraper — Training Data', size: 22, bold: true, color: '#ffffff' },
        { text: '153 products · 1,005 images · rareboots · bootroom', size: 14, bold: false, color: 'rgba(255,255,255,0.6)' },
      ],
      position: [55, 0, 0],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
