import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { nextMix, targetFor } from '../daynight.js'

// Advances st.mix toward st.target. Returns true while it is still moving.
export function stepMix(st, dt) {
  st.mix = nextMix(st.mix, st.target, dt)
  return st.mix !== st.target
}

// Follows the system colour scheme. Returns a ref { mix, target } read each frame.
export function useDayNight() {
  const invalidate = useThree((s) => s.invalidate)
  const st = useRef(null)
  if (!st.current) {
    const dark = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)').matches : true
    const t = targetFor(dark)
    st.current = { mix: t, target: t }
  }
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => {
      st.current.target = targetFor(mq.matches)
      invalidate()
    }
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [invalidate])
  return st
}
