import * as THREE from 'three'
import { SpeechBubble } from './SpeechBubble.js'

export class NPCBase {
  constructor({ id, position, color, label, role }) {
    this.id = id
    this.spawnPos = position
    this.color = color
    this.label = label
    this.role = role
    this.group = new THREE.Group()
    this.idlePhase = Math.random() * Math.PI * 2
    this.built = false
  }

  build(scene) {
    if (this.built) return
    this.built = true

    const mat = new THREE.MeshLambertMaterial({ color: this.color })
    const darkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(this.color).multiplyScalar(0.4) })
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xd4956a })

    // Body parts
    this.body   = this._part(new THREE.BoxGeometry(0.55, 0.85, 0.32), mat)
    this.head   = this._part(new THREE.BoxGeometry(0.42, 0.42, 0.42), skinMat)
    this.legL   = this._part(new THREE.BoxGeometry(0.22, 0.72, 0.22), darkMat)
    this.legR   = this._part(new THREE.BoxGeometry(0.22, 0.72, 0.22), darkMat)
    this.armL   = this._part(new THREE.BoxGeometry(0.18, 0.68, 0.18), mat)
    this.armR   = this._part(new THREE.BoxGeometry(0.18, 0.68, 0.18), mat)

    // Positioning (relative to group root at feet)
    this.legL.position.set(-0.14, 0.36, 0)
    this.legR.position.set( 0.14, 0.36, 0)
    this.body.position.set(0, 1.16, 0)
    this.head.position.set(0, 1.80, 0)
    this.armL.position.set(-0.365, 1.12, 0)
    this.armR.position.set( 0.365, 1.12, 0)

    this.group.add(this.body, this.head, this.legL, this.legR, this.armL, this.armR)

    // Glow orb above head (character color indicator)
    const glowGeo = new THREE.SphereGeometry(0.12, 8, 8)
    const glowMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.8 })
    this.glowOrb = new THREE.Mesh(glowGeo, glowMat)
    this.glowOrb.position.set(0, 2.5, 0)
    this.group.add(this.glowOrb)

    // Interaction ring on ground
    const ringGeo = new THREE.RingGeometry(0.7, 0.85, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false
    })
    this.ring = new THREE.Mesh(ringGeo, ringMat)
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.set(0, 0.02, 0)
    this.group.add(this.ring)

    // Speech bubble
    this.bubble = new SpeechBubble(this.id)
    this.group.add(this.bubble.sprite)

    // Position in world
    this.group.position.set(...this.spawnPos)
    scene.add(this.group)
  }

  _part(geo, mat) {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = false
    return mesh
  }

  update(t, delta) {
    if (!this.built) return
    const phase = t + this.idlePhase

    // Gentle body bob
    this.group.position.y = Math.sin(phase * 0.9) * 0.04

    // Head slow look side to side
    if (this.head) this.head.rotation.y = Math.sin(phase * 0.5) * 0.3

    // Arm sway
    if (this.armL) this.armL.rotation.x = Math.sin(phase * 0.9) * 0.1
    if (this.armR) this.armR.rotation.x = -Math.sin(phase * 0.9) * 0.1

    // Glow pulse
    if (this.glowOrb) {
      this.glowOrb.material.opacity = 0.5 + Math.sin(phase * 1.5) * 0.3
      this.glowOrb.position.y = 2.5 + Math.sin(phase * 1.2) * 0.08
    }

    // Ring pulse
    if (this.ring) {
      this.ring.material.opacity = 0.1 + Math.sin(phase * 1.1) * 0.12
    }

    if (this.bubble) this.bubble.update(delta ?? 0.016)
  }

  // Face toward player when interacting
  lookAt(targetPos) {
    const dx = targetPos.x - this.group.position.x
    const dz = targetPos.z - this.group.position.z
    this.group.rotation.y = Math.atan2(dx, dz)
  }
}
