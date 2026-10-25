import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement as h, act } from 'react'
import { createRoot } from 'react-dom/client'
import { projectBySlug } from '../../src/shelf/projects.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const invalidate = vi.fn()
vi.mock('@react-three/fiber', () => ({
  useThree: (sel) => sel({ gl: { capabilities: { getMaxAnisotropy: () => 1 } }, invalidate }),
}))

const { useCoverTexture } = await import('../../src/shelf/three/useCoverTexture.js')

let hook
function Probe({ project }) { hook = useCoverTexture(project, { upstream: {}, downloads: {} }); return null }

let host
let root
afterEach(() => { try { act(() => root.unmount()) } catch { /* already */ } host?.remove(); invalidate.mockClear() })

describe('useCoverTexture teardown', () => {
  it('does not paint or invalidate when an image lands after unmount', () => {
    host = document.createElement('div')
    root = createRoot(host)
    const project = projectBySlug('square-a')
    const created = []
    const RealImage = globalThis.Image
    globalThis.Image = class extends RealImage { constructor() { super(); created.push(this) } }
    try {
      act(() => root.render(h(Probe, { project })))
      expect(created.length).toBeGreaterThan(0)
      invalidate.mockClear()
      act(() => root.unmount())
      created.forEach((img) => img.dispatchEvent(new Event('load')))
      expect(invalidate).not.toHaveBeenCalled()
    } finally {
      globalThis.Image = RealImage
    }
  })

  it('asks for full-length images again after the project changes', () => {
    host = document.createElement('div')
    root = createRoot(host)
    act(() => root.render(h(Probe, { project: projectBySlug('square-a') })))
    hook.wantFull()
    act(() => root.render(h(Probe, { project: projectBySlug('matchday') })))
    const spy = vi.spyOn(globalThis, 'Image')
    hook.wantFull()
    expect(spy).toHaveBeenCalled()
  })
})
