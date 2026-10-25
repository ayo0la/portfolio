import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'motion/react'
import { initialState, shelfReducer, slugFromHash } from './state.js'
import { ShelfStateContext } from './ShelfStateContext.js'
import { attachBridge, applyHash, setActiveEntry } from './bridge.js'
import { layoutFor, panFor } from './three/layout.js'
import { ShelfScene } from './three/ShelfScene.jsx'
import { OpenPanel } from './overlay/OpenPanel.jsx'
import { FaceLayer } from './overlay/FaceLayer.jsx'
import { PanIndicator } from './overlay/PanIndicator.jsx'
import { DPR_TIERS, startTier } from './perf.js'
import { AdaptiveDpr } from './three/AdaptiveDpr.jsx'
import { PROJECTS, projectBySlug } from './projects.js'
import { onNpmDownloads, fetchNpmDownloadsOnce } from '../sections/projects.js'
import upstream from '../data/upstream.json'


function initial() {
  const slug = slugFromHash(window.location.hash)
  return slug ? shelfReducer(initialState, { type: 'open', slug }) : initialState
}

function useElementSize(el) {
  const [size, setSize] = useState(() => ({
    width: el.clientWidth || window.innerWidth,
    height: el.clientHeight || window.innerHeight,
  }))
  useEffect(() => {
    const read = () => ({ width: el.clientWidth || window.innerWidth, height: el.clientHeight || window.innerHeight })
    const on = () => setSize((cur) => {
      const next = read()
      return cur.width === next.width && cur.height === next.height ? cur : next
    })
    window.addEventListener('resize', on)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(on) : null
    ro?.observe(el)
    return () => { window.removeEventListener('resize', on); ro?.disconnect() }
  }, [el])
  return size
}

// Render nothing while the shelf is off screen.
function useOnScreen(el) {
  const [visible, setVisible] = useState(true)
  const [entered, setEntered] = useState(typeof IntersectionObserver !== 'function')
  useEffect(() => {
    const target = document.getElementById('projects') || el
    if (typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting)
      setVisible(on)
      if (on) setEntered(true)
    })
    io.observe(target)
    return () => io.disconnect()
  }, [el])
  return { visible, entered }
}

function App({ el, onContextLost }) {
  const [state, dispatch] = useReducer(shelfReducer, undefined, initial)
  const stateRef = useRef(state)
  stateRef.current = state

  const [pointerHover, setPointerHover] = useState(null)
  const [indexHover, setIndexHover] = useState(null)
  const [kbFocus, setKbFocus] = useState(null)
  const [downloads, setDownloads] = useState({})
  const [isDay, setIsDay] = useState(false)
  const size = useElementSize(el)
  const { visible, entered } = useOnScreen(el)
  const [face, setFace] = useState(null)
  const [panIndex, setPanIndex] = useState(0)
  const [panRequest, setPanRequest] = useState(null)
  const layout = layoutFor(size.width)
  const [tierRaw, setTier] = useState(() => startTier())
  const tier = Math.min(tierRaw, DPR_TIERS[layout.mode].length - 1)
  const hoverSlug = pointerHover ?? indexHover

  // HTML layer -> island
  useEffect(
    () => attachBridge({ doc: document, getState: () => stateRef.current, dispatch, setIndexHover, setKbFocus }),
    [],
  )

  // URL hash: state -> hash, and hash -> state
  const prevOpen = useRef(null)
  useEffect(() => {
    applyHash(window, prevOpen.current, state.open)
    prevOpen.current = state.open
  }, [state.open])
  useEffect(() => {
    const onHash = () => {
      const slug = slugFromHash(window.location.hash)
      if (slug) {
        if (stateRef.current.open !== slug) dispatch({ type: 'open', slug })
      } else if (stateRef.current.open) {
        dispatch({ type: 'close' })
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // index row highlight and pull cursor follow the hovered record
  useEffect(() => {
    setActiveEntry(document, hoverSlug)
    if (hoverSlug && pointerHover) document.body.dataset.cursor = 'pull'
    else delete document.body.dataset.cursor
    return () => { delete document.body.dataset.cursor }
  }, [hoverSlug, pointerHover])
  useEffect(() => () => setActiveEntry(document, null), [])

  // live npm numbers: the shared store, one fetch
  useEffect(() => {
    const off = onNpmDownloads((map) => setDownloads(map))
    fetchNpmDownloadsOnce()
    return off
  }, [])

  const data = useMemo(() => ({ upstream, downloads }), [downloads])
  const ctx = useMemo(() => ({ state, dispatch }), [state])
  const open = state.open ? projectBySlug(state.open) : null
  const openIndex = open ? PROJECTS.indexOf(open) : -1
  const panX = open ? panFor(openIndex, layout) : 0

  // the canvas is decorative; the panel and its buttons are not, so the mount must not be aria-hidden
  useEffect(() => {
    const had = el.getAttribute('aria-hidden')
    el.removeAttribute('aria-hidden')
    return () => { if (had !== null) el.setAttribute('aria-hidden', had) }
  }, [el])

  const onCreated = useCallback(({ gl }) => {
    gl.domElement.setAttribute('aria-hidden', 'true')
    gl.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      onContextLost?.()
    })
  }, [onContextLost])

  return (
    <ShelfStateContext.Provider value={ctx}>
      <Canvas
        frameloop={visible ? 'demand' : 'never'}
        shadows
        dpr={Math.min(DPR_TIERS[layout.mode][tier], window.devicePixelRatio || 1)}
        camera={{ position: layout.camera.position, fov: layout.camera.fov, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ touchAction: layout.mode === 'phone' ? 'pan-y' : 'auto' }}
        onPointerMissed={() => { if (stateRef.current.open) dispatch({ type: 'close' }) }}
        onCreated={onCreated}
      >
        <AdaptiveDpr mode={layout.mode} tier={tier} onTier={setTier} />
        <ShelfScene
          state={state}
          dispatch={dispatch}
          hoverSlug={hoverSlug}
          setHover={setPointerHover}
          kbFocus={kbFocus}
          data={data}
          layout={layout}
          visible={visible}
          entered={entered}
          onFace={setFace}
          panRequest={panRequest}
          onIndex={setPanIndex}
          onDay={setIsDay}
        />
      </Canvas>
      <div className="shelf-overlay">
        <div className={`shelf-scrim${state.open ? ' on' : ''}${isDay ? ' is-day' : ''}`} />
        {open && (
          <FaceLayer
            project={open}
            flipped={state.flipped}
            layout={layout}
            size={size}
            ready={!!face && face.ready && face.slug === open.slug && face.flipped === state.flipped}
            panX={face ? face.panX : panX}
            downloads={downloads}
            upstream={upstream}
          />
        )}
        {layout.mode === 'phone' && !open && (
          <PanIndicator
            projects={PROJECTS}
            index={panIndex}
            onPick={(i) => setPanRequest({ index: i, n: (panRequest?.n ?? 0) + 1 })}
          />
        )}
        <AnimatePresence>
          {open && (
            <OpenPanel
              key="panel"
              project={open}
              flipped={state.flipped}
              dayMix={isDay ? 1 : 0}
              onFlip={() => dispatch({ type: 'flip' })}
              onClose={() => dispatch({ type: 'close' })}
              onNext={() => dispatch({ type: 'next' })}
              onPrev={() => dispatch({ type: 'prev' })}
            />
          )}
        </AnimatePresence>
      </div>
    </ShelfStateContext.Provider>
  )
}

export function mountShelf3D(el, { onContextLost } = {}) {
  const root = createRoot(el)
  root.render(<App el={el} onContextLost={onContextLost} />)
  return { unmount: () => root.unmount() }
}
