import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadow } from './ContactShadow.jsx'
import { sunShadowOn } from '../perf.js'
import {
  CanvasTexture, Color, Object3D, PMREMGenerator, SRGBColorSpace, MeshStandardMaterial, BoxGeometry,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { blendRoom } from '../daynight.js'
import { useDayNight, stepMix } from './useDayNight.js'
import { approach, RATES, settled } from './easing.js'

const WALL_DIM_OPEN = 0.55

// The sun is a spotlight that projects a four-pane window across the wall.
function windowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const x = c.getContext('2d')
  if (!x) return null
  x.fillStyle = '#000'
  x.fillRect(0, 0, 512, 512)
  x.filter = 'blur(10px)'
  x.fillStyle = '#fff'
  const w = 150, h = 170, g = 16
  const ox = 256 - w - g / 2
  const oy = 256 - h - g / 2
  for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) x.fillRect(ox + q * (w + g), oy + r * (h + g), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// roomRef.current is refreshed every frame with the blended palette for the records to read.
export function Room({ layout, anyOpen, roomRef, onDay }) {
  const { gl, scene, invalidate } = useThree()
  const dayNight = useDayNight()
  const wallMat = useRef()
  const ambient = useRef()
  const key = useRef()
  const sun = useRef()
  const wallDim = useRef(null)
  const hostRef = useRef(null)
  const wasDay = useRef(null)
  useEffect(() => {
    // the section takes the room colour so its edge never mismatches during the fade
    const host = gl.domElement.closest('#projects')
    hostRef.current = host
    return () => {
      host?.style.removeProperty('--room-bg')
      host?.style.removeProperty('--room-mix')
    }
  }, [gl])

  const keyTarget = useMemo(() => { const o = new Object3D(); o.position.set(0, 0.6, 0); return o }, [])
  const sunTarget = useMemo(() => { const o = new Object3D(); o.position.set(-1.2, 0.9, 0); return o }, [])
  const sunMap = useMemo(windowTexture, [])
  const shelfGeo = useMemo(() => new RoundedBoxGeometry(layout.shelfWidth, 0.07, 0.42, 2, 0.012), [layout.shelfWidth])
  const lipGeo = useMemo(() => new BoxGeometry(layout.shelfWidth, 0.006, 0.004), [layout.shelfWidth])
  const shelfMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.6, metalness: 0 }), [])
  const edgeMat = useMemo(() => new MeshStandardMaterial({ roughness: 0.3, emissive: '#000000' }), [])

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const env = new RoomEnvironment()
    const rt = pmrem.fromScene(env, 0.04)
    scene.environment = rt.texture
    scene.background = new Color('#121110')
    // shadow maps are static: records and the sun ask for a refresh when something moves
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
    return () => {
      scene.environment = null
      rt.dispose()
      pmrem.dispose()
      env.dispose?.()
    }
  }, [gl, scene, invalidate])

  useEffect(() => () => {
    shelfGeo.dispose(); lipGeo.dispose(); shelfMat.dispose(); edgeMat.dispose(); sunMap?.dispose()
  }, [shelfGeo, lipGeo, shelfMat, edgeMat, sunMap])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    let moving = stepMix(dayNight.current, dt)
    const r = blendRoom(dayNight.current.mix)
    roomRef.current = r

    if (wallDim.current === null) wallDim.current = anyOpen ? WALL_DIM_OPEN : 1
    const wantDim = anyOpen ? WALL_DIM_OPEN : 1
    wallDim.current = approach(wallDim.current, wantDim, RATES.wall, dt)
    if (!settled(wallDim.current, wantDim)) moving = true
    else wallDim.current = wantDim

    scene.background.set(r.bg)
    const isDay = dayNight.current.mix > 0.5
    if (wasDay.current !== isDay) { wasDay.current = isDay; onDay?.(isDay) }
    const host = hostRef.current
    if (host) {
      host.style.setProperty('--room-bg', r.bg)
      host.style.setProperty('--room-mix', dayNight.current.mix.toFixed(3))
    }
    wallMat.current.color.set(r.wall).multiplyScalar(wallDim.current)
    shelfMat.color.set(r.shelf)
    edgeMat.color.set(r.edge)
    edgeMat.emissive.set(r.edgeEmissive)
    ambient.current.intensity = r.ambient
    key.current.color.set(r.key)
    key.current.intensity = r.keyIntensity
    scene.environmentIntensity = r.env
    sun.current.intensity = r.sun
    const sunCasts = sunShadowOn(dayNight.current.mix)
    if (sun.current.castShadow !== sunCasts) {
      sun.current.castShadow = sunCasts
      gl.shadowMap.needsUpdate = true
    }
    if (moving) invalidate()
  }, -1)

  return (
    <>
      <mesh position={[0, 1.5, -0.02]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <meshStandardMaterial ref={wallMat} roughness={0.95} />
      </mesh>

      <ambientLight ref={ambient} intensity={0.18} />
      <primitive object={keyTarget} />
      <spotLight
        ref={key}
        position={[-1.2, 7.5, 3.2]}
        target={keyTarget}
        angle={Math.PI / 5}
        penumbra={0.7}
        distance={30}
        decay={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={10}
        shadow-blurSamples={16}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[4, 2, 6]} intensity={0.35} />
      <primitive object={sunTarget} />
      <spotLight
        ref={sun}
        position={[7, 6.5, 6]}
        target={sunTarget}
        color="#ffe7bd"
        intensity={0}
        distance={40}
        angle={Math.PI / 7}
        penumbra={0.25}
        decay={1}
        map={sunMap}
        shadow-mapSize={[1024, 1024]}
        shadow-radius={3}
        shadow-bias={-0.0005}
      />

      {layout.rowYs.map((y) => (
        <group key={y}>
          <mesh geometry={shelfGeo} material={shelfMat} position={[0, y - 0.035, 0.21]} castShadow receiveShadow />
          <mesh geometry={lipGeo} material={edgeMat} position={[0, y - 0.004, 0.422]} />
          <ContactShadow
            position={[0, y + 0.002, 0.21]}
            scale={[layout.shelfWidth, 0.9]}
            far={1.4}
            opacity={0.45}
            blur={2.4}
            resolution={512}
          />
        </group>
      ))}
    </>
  )
}
