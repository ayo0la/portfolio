import * as THREE from 'three'
import { buildBillboard } from './billboardBuilder.js'

export class SkillsZone {
  build(scene) {
    buildBillboard(scene, {
      color: '#00e5ff',
      lines: [
        { text: 'WHAT I BUILD WITH',        size: 30, bold: true,  color: '#00e5ff' },
        { text: '',                          size: 10 },
        { text: 'AI / ML',                  size: 22, bold: true,  color: '#ffffff' },
        { text: 'PyTorch · EfficientNet · Roboflow', size: 17, bold: false, color: 'rgba(255,255,255,0.65)' },
        { text: '',                          size: 8 },
        { text: 'Full-Stack',               size: 22, bold: true,  color: '#ffffff' },
        { text: 'React · Node · Supabase · Vite', size: 17, bold: false, color: 'rgba(255,255,255,0.65)' },
        { text: '',                          size: 8 },
        { text: 'Scraping  ·  Mobile  ·  Infra', size: 17, bold: false, color: 'rgba(255,255,255,0.5)' },
        { text: 'Playwright · React Native · Vercel', size: 15, bold: false, color: 'rgba(255,255,255,0.4)' },
      ],
      position: [-55, 0, 0],
    })
  }
  onEnter() {}
  onExit()  {}
  update()  {}
}
