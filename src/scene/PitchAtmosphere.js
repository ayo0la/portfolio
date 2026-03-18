import * as THREE from 'three'

export function buildPitchAtmosphere(scene) {
  _addCornerFlags(scene)
  _addAdboards(scene)
  _addDugoutBenches(scene)
}

function _addCornerFlags(scene) {
  const CORNERS = [[-52.5, -34], [-52.5, 34], [52.5, -34], [52.5, 34]]
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
  const flagMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })

  CORNERS.forEach(([cx, cz]) => {
    const group = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), poleMat)
    pole.position.y = 0.75
    group.add(pole)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), flagMat)
    flag.position.set(0.17, 1.38, 0)
    group.add(flag)
    group.position.set(cx, 0, cz)
    scene.add(group)
  })
}

function _addAdboards(scene) {
  const POSITIONS = [
    [-30, 35], [-10, 35], [10, 35], [30, 35],
    [-30,-35], [-10,-35], [10,-35], [30,-35],
  ]
  const BW = 4.8, BH = 0.9, BD = 0.14
  const bgMat  = new THREE.MeshBasicMaterial({ color: 0x001122 })
  const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 })

  POSITIONS.forEach(([ax, az]) => {
    const group = new THREE.Group()
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), bgMat)
    back.position.y = BH / 2
    group.add(back)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.8, 0.1, BD + 0.01), goldMat)
    stripe.position.y = BH - 0.08
    group.add(stripe)
    group.position.set(ax, 0, az)
    scene.add(group)
  })
}

function _addDugoutBenches(scene) {
  [[-35, 3], [35, 3]].forEach(([bx, bz]) => {
    const mat    = new THREE.MeshLambertMaterial({ color: 0x2a3545 })
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1a2535 })
    const bench  = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.36, 1.1), mat)
    bench.position.set(bx, 0.35, bz)
    ;[-2, 0, 2].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 1.0), legMat)
      leg.position.set(lx, -0.42, 0)
      bench.add(leg)
    })
    scene.add(bench)
  })
}
