// src/scroll/SmoothScroll.js
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initSmoothScroll() {
  const lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)
  const onTick = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(onTick)
  gsap.ticker.lagSmoothing(0)
  return lenis
}
