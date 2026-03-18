// src/scroll/Animations.js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initAnimations() {
  // Independent guards — mobile skips all; reduced-motion skips GSAP only
  if (window.innerWidth < 768) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  _animateHero()
  _animateAbout()
  _animateMdfld()
  _animateProjects()
  _animateContact()
}

// ── Hero ──────────────────────────────────────────────────────
function _animateHero() {
  const nameEl = document.querySelector('.hero-name')
  if (!nameEl) return

  // Split by <br> to preserve line breaks, then wrap each char
  const lines = nameEl.innerHTML.split('<br>')
  nameEl.innerHTML = lines.map(line =>
    line.split('').map(ch =>
      `<span class="char">${ch}</span>`
    ).join('')
  ).join('<br>')

  gsap.from('.hero-name .char', {
    opacity: 0,
    y: 20,
    stagger: 0.02,
    duration: 0.5,
    delay: 0.3,
    ease: 'power2.out',
  })

  gsap.from('.hero-sub', {
    opacity: 0,
    y: 10,
    duration: 0.6,
    delay: 0.8,
    ease: 'power2.out',
  })
}

// ── About ─────────────────────────────────────────────────────
function _animateAbout() {
  // Word-stagger on headline: wrap each word in <span class="word">
  const headlineEl = document.querySelector('.about-headline')
  if (headlineEl) {
    const lines = headlineEl.innerHTML.split('<br>')
    headlineEl.innerHTML = lines.map(line =>
      line.split(' ')
        .filter(w => w.length)
        .map(w => `<span class="word">${w}</span>`)
        .join(' ')
    ).join('<br>')
  }

  gsap.from('.about-headline .word', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    x: -40,
    opacity: 0,
    stagger: 0.08,
    duration: 0.7,
    ease: 'power2.out',
  })

  gsap.from('.about-right .body-copy', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    y: 30,
    opacity: 0,
    duration: 0.7,
    delay: 0.15,
    ease: 'power2.out',
  })

  gsap.from('.about-right .skill-chips', {
    scrollTrigger: { trigger: '#about', start: 'top 75%' },
    y: 20,
    opacity: 0,
    duration: 0.6,
    delay: 0.3,
    ease: 'power2.out',
  })
}

// ── MDFLD ─────────────────────────────────────────────────────
function _animateMdfld() {
  // Line-stagger on headline: wrap each <br>-delimited line in <span class="line">
  const headlineEl = document.querySelector('.mdfld-headline')
  if (headlineEl) {
    const lines = headlineEl.innerHTML.split('<br>')
    headlineEl.innerHTML = lines
      .map(line => `<span class="line">${line}</span>`)
      .join('')
  }

  gsap.from('.mdfld-headline .line', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    y: 30,
    opacity: 0,
    stagger: 0.12,
    duration: 0.8,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-bg-word', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    opacity: 0,
    scale: 1.05,
    duration: 1,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-desc', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    y: 20,
    opacity: 0,
    duration: 0.7,
    delay: 0.2,
    ease: 'power2.out',
  })

  gsap.from('.mdfld-cta', {
    scrollTrigger: { trigger: '#mdfld', start: 'top 70%' },
    x: -20,
    opacity: 0,
    duration: 0.6,
    delay: 0.4,
    ease: 'power2.out',
  })
}

// ── Projects ──────────────────────────────────────────────────
function _animateProjects() {
  gsap.from('.project-card', {
    scrollTrigger: { trigger: '#projects', start: 'top 80%' },
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power2.out',
  })
}

// ── Contact ───────────────────────────────────────────────────
function _animateContact() {
  gsap.from('.contact-heading', {
    scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    x: -40,
    opacity: 0,
    duration: 0.7,
    ease: 'power2.out',
  })

  gsap.from('.contact-links', {
    scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    opacity: 0,
    duration: 0.6,
    delay: 0.2,
    ease: 'power2.out',
  })
}
