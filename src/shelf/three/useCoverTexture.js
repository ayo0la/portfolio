import { useEffect, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { drawCover, W } from '../covers/draw.js'
import { usable, whenDecoded } from '../covers/images.js'

const cache = new Map()
function loadImage(src, onLoad) {
  let img = cache.get(src)
  if (!img) {
    img = new Image()
    img.decoding = 'async'
    img.src = src
    cache.set(src, img)
  }
  if (img.complete && img.naturalWidth > 0) whenDecoded(img, () => onLoad?.())
  else img.addEventListener('load', () => whenDecoded(img, () => onLoad?.()), { once: true })
  return img
}

export { usable }

function imageSources(project, full) {
  const c = project.cover
  if (c.kind === 'fan') return { sites: c.sites.map((s) => (full ? s.tall : s.still)) }
  if (c.tall) return { tall: full ? c.tall : c.still }
  return {}
}

// One 512 canvas texture per record. paint() redraws it; call it only while it must change.
export function useCoverTexture(project, data) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const dataRef = useRef(data)
  dataRef.current = data
  const last = useRef({ t: 0, playing: false })
  const imgs = useRef({})
  const full = useRef(false)
  // bumped on cleanup and on every project change; a decode that lands after that is dropped
  const gen = useRef(0)

  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = W
    const ctx = canvas.getContext('2d')
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return { canvas, ctx, texture }
  }, [])

  useEffect(() => {
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 1)
  }, [gl, texture])

  const paintRef = useRef(null)
  paintRef.current = (state = last.current) => {
    last.current = { t: state.t, playing: state.playing }
    if (!ctx) return
    const raw = imgs.current
    const images = {}
    if (raw.tall) images.tall = usable(raw.tall) ? raw.tall : undefined
    if (raw.sites) images.sites = raw.sites.map((im) => (usable(im) ? im : undefined))
    drawCover(ctx, project, { t: state.t, playing: state.playing, images, data: dataRef.current })
    texture.needsUpdate = true
  }

  const load = (wantFull) => {
    const src = imageSources(project, wantFull)
    const mine = gen.current
    const stale = () => gen.current !== mine
    const done = () => {
      if (stale()) return
      paintRef.current()
      invalidate()
    }
    if (!wantFull) {
      if (src.tall) imgs.current = { tall: loadImage(src.tall, done) }
      if (src.sites) imgs.current = { sites: src.sites.map((s) => loadImage(s, done)) }
      return
    }
    // keep the stills on screen until the full-length images are decoded
    if (src.tall) {
      const img = loadImage(src.tall, () => {
        if (stale()) return
        if (usable(img)) { imgs.current = { tall: img }; done() }
      })
    }
    if (src.sites) {
      src.sites.forEach((s, i) => {
        const img = loadImage(s, () => {
          if (stale() || !usable(img)) return
          const sites = [...(imgs.current.sites || [])]
          sites[i] = img
          imgs.current = { sites }
          done()
        })
      })
    }
  }

  useEffect(() => {
    full.current = false
    load(false)
    paintRef.current({ t: 0, playing: false })
    invalidate()
    return () => {
      gen.current += 1
      texture.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, texture])

  // repaint the still when live data (npm downloads) arrives
  useEffect(() => {
    if (!last.current.playing) {
      paintRef.current({ t: 0, playing: false })
      invalidate()
    }
  }, [data, invalidate])

  return {
    texture,
    paint: (state) => paintRef.current(state),
    // full-length screenshots load on first hover or open
    wantFull: () => {
      if (full.current) return
      full.current = true
      load(true)
    },
    canvas,
  }
}
