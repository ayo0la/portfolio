import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createFrameWindow, nextTier } from '../perf.js'

const WINDOW = 45 // sustained frames per reading

// Raises the pixel ratio while frames are cheap and drops it when they are not. Only frames that
// follow each other closely count; a sleeping loop never reads as slow. After a drop it never climbs back.
export function AdaptiveDpr({ mode, tier, onTier }) {
  const win = useRef(null)
  const drops = useRef(0)
  if (!win.current) win.current = createFrameWindow(WINDOW)
  useFrame((_, delta) => {
    const avg = win.current.push(delta)
    if (avg === null) return
    const r = nextTier(mode, tier, avg, drops.current)
    drops.current = r.drops
    if (r.tier !== tier) onTier(r.tier)
  })
  return null
}
