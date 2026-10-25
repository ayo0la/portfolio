import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Color, Mesh, MeshDepthMaterial, PlaneGeometry, ShaderMaterial, WebGLRenderTarget,
} from 'three'
import { contactRefreshDue, withShadowFlagPreserved } from '../perf.js'
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib'

// drei's ContactShadows, re-rendered only on frames where the shadow maps are also refreshed
// (a record moved). Drei's own version re-renders its depth pass and four blurs every frame.
export function ContactShadow({
  scale, far = 1.4, opacity = 0.45, blur = 2.4, resolution = 512, color = '#000000', ...props
}) {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const group = useRef()
  const cam = useRef()
  const width = Array.isArray(scale) ? scale[0] : scale
  const height = Array.isArray(scale) ? scale[1] : scale

  const parts = useMemo(() => {
    const target = new WebGLRenderTarget(resolution, resolution)
    const targetBlur = new WebGLRenderTarget(resolution, resolution)
    target.texture.generateMipmaps = targetBlur.texture.generateMipmaps = false
    const plane = new PlaneGeometry(width, height).rotateX(Math.PI / 2)
    const blurPlane = new Mesh(plane)
    const depth = new MeshDepthMaterial()
    depth.depthTest = depth.depthWrite = false
    depth.onBeforeCompile = (shader) => {
      shader.uniforms = { ...shader.uniforms, ucolor: { value: new Color(color) } }
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec3 ucolor;\nvoid main() {')
        .replace('vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );')
    }
    const hBlur = new ShaderMaterial(HorizontalBlurShader)
    const vBlur = new ShaderMaterial(VerticalBlurShader)
    hBlur.depthTest = vBlur.depthTest = false
    return { target, targetBlur, plane, blurPlane, depth, hBlur, vBlur }
  }, [resolution, width, height, color])

  useEffect(() => () => {
    parts.target.dispose(); parts.targetBlur.dispose(); parts.plane.dispose()
    parts.depth.dispose(); parts.hBlur.dispose(); parts.vBlur.dispose()
  }, [parts])

  const dirty = useRef(true)
  useEffect(() => { dirty.current = true }, [parts])

  const blurPass = (amount) => {
    const { blurPlane, hBlur, vBlur, target, targetBlur } = parts
    blurPlane.visible = true
    blurPlane.material = hBlur
    hBlur.uniforms.tDiffuse.value = target.texture
    hBlur.uniforms.h.value = amount / 256
    gl.setRenderTarget(targetBlur)
    gl.render(blurPlane, cam.current)
    blurPlane.material = vBlur
    vBlur.uniforms.tDiffuse.value = targetBlur.texture
    vBlur.uniforms.v.value = amount / 256
    gl.setRenderTarget(target)
    gl.render(blurPlane, cam.current)
    blurPlane.visible = false
  }

  // runs after the records posed themselves this frame; gl.shadowMap.needsUpdate says one moved
  useFrame(() => {
    if (!cam.current || !contactRefreshDue(gl.shadowMap.needsUpdate, dirty.current)) return
    dirty.current = false
    const { background, overrideMaterial } = scene
    group.current.visible = false
    scene.background = null
    scene.overrideMaterial = parts.depth
    withShadowFlagPreserved(gl.shadowMap, () => {
      gl.setRenderTarget(parts.target)
      gl.render(scene, cam.current)
      blurPass(blur)
      blurPass(blur * 0.4)
      gl.setRenderTarget(null)
    })
    group.current.visible = true
    scene.overrideMaterial = overrideMaterial
    scene.background = background
  })

  return (
    <group rotation-x={Math.PI / 2} {...props} ref={group}>
      <mesh geometry={parts.plane} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial transparent map={parts.target.texture} opacity={opacity} depthWrite={false} />
      </mesh>
      <orthographicCamera ref={cam} args={[-width / 2, width / 2, height / 2, -height / 2, 0, far]} />
    </group>
  )
}
