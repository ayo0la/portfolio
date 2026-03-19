# Ayoola Morakinyo — Portfolio Redesign Spec

**Date:** 2026-03-18
**Replaces:** The existing Three.js stadium + Rapier physics car portfolio (complete ground-up rebuild)

---

## 1. Goal

A dark, cinematic personal brand website for Ayoola Morakinyo. Not a 3D game — a proper portfolio site that feels alive through scroll animations, an ambient WebGL canvas, and a custom cursor. Primary purpose is personal branding; secondarily signals credibility to employers, investors, and clients.

---

## 2. Sections

Five sections in order, all on a single page:

| # | Name | Purpose |
|---|------|---------|
| 01 | Hero | First impression — name, personal logo, scroll prompt |
| 02 | About | Who Ayoola is in plain language |
| 03 | MDFLD | Featured project — full-bleed treatment |
| 04 | Other Projects | Supporting work — card grid |
| 05 | Contact | Clean close — email + social links |

---

## 3. Visual Design System

### Colours
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#080808` | Page background |
| `--surface` | `#0f0f0f` | Raised card/section bg |
| `--text` | `#ffffff` | Primary text |
| `--text-muted` | `rgba(255,255,255,0.55)` | Secondary / captions (WCAG AA compliant on `#080808`) |
| `--gold` | `#ffd700` | Accent — MDFLD, highlights, cursor glow |
| `--border` | `rgba(255,255,255,0.07)` | Card borders |

### Typography
- **Display font:** Bebas Neue (Google Fonts, loaded via `<link>` in `index.html`)
- **Monospace:** `'Courier New', monospace` (system font, no load cost)
- **Body:** `system-ui, -apple-system, sans-serif`

| Role | Style |
|------|-------|
| Hero name | Bebas Neue, `font-size: clamp(4rem, 10vw, 9rem)`, `letter-spacing: 2px`, uppercase |
| Section headline | Bebas Neue, `font-size: clamp(2rem, 5vw, 4.5rem)`, `letter-spacing: 1px` |
| Mono detail | `'Courier New'`, `font-size: 0.6rem`, `letter-spacing: 4px`, uppercase |
| Body copy | System sans-serif, `font-size: 1rem`, `line-height: 1.7`, `color: var(--text-muted)` |

### Spacing
- Section `min-height: 100vh`
- Section padding: `clamp(4rem, 8vw, 8rem)` vertical, `clamp(1.5rem, 6vw, 6rem)` horizontal
- Max content width: `1200px`, centred with `margin: 0 auto`

### Responsive breakpoint
- **Desktop:** `≥ 768px` — all layouts, cursor, animations active
- **Mobile:** `< 768px` — single-column layouts, GSAP ScrollTrigger animations disabled (elements visible from the start, no entrance motion), custom cursor hidden, canvas still runs

---

## 4. Background Canvas

A single `<canvas id="bg">` sits fixed behind all content (`position: fixed; inset: 0; z-index: -1`). Two layers composited in a single `requestAnimationFrame` loop:

### Layer 1 — Film grain
- Pre-generated 6 offscreen canvases of random per-pixel RGBA noise, built once on init and on `resize`
- Cycled at one new frame every ~50ms to animate the grain
- Drawn with `globalCompositeOperation: 'screen'`, `globalAlpha: 0.35`
- Vignette: dark radial gradient (`transparent` centre → `rgba(0,0,0,0.6)` edge) drawn after grain

### Layer 2 — Floating particles
- 90 particles; each: `{ x, y, vx, vy, r: 0.8–2.8, gold: bool }`
- Gold particles: 25% of total, `rgba(255,215,0,0.75)`; white: `rgba(255,255,255,0.55)`
- Velocity damping: `vx *= 0.98` per frame; initial speed ≤ 0.5px/frame
- Cursor attraction: within 200px, nudge toward mouse at `force * 0.0008`
- Connection lines to neighbours within 110px, alpha = `(1 - dist/110) * 0.25`
- Cursor glow: gold radial gradient, radius 140px, `alpha: 0.07`
- Particles wrap at canvas edges

**Each frame:** fill `#080808` → draw particles + connections → draw grain frame → draw vignette.

**On mobile:** canvas still runs but cursor attraction is disabled (no `mousemove` listener added).

---

## 5. Hero Section

Full-viewport (`min-height: 100vh`), no background colour (transparent — canvas shows through).

### Desktop layout (≥ 768px)
Two-column flex row, `align-items: center`, `gap: 4rem`:
- **Left column (60%):** heading + subline + scroll indicator
- **Right column (40%):** 3D logo canvas, centred within its column

### Mobile layout (< 768px)
Single column, centred:
- Heading + subline
- 3D logo canvas below name, centred, smaller (120px tall)
- Scroll indicator below logo

### Content
- Heading: `AYOOLA` / `MORAKINYO` (two lines, Bebas Neue, massive)
- Monospace subline: `FOUNDER · BUILDER · ATLANTA`
- Scroll indicator: `↓` arrow in monospace, `opacity: 0.3`, CSS `@keyframes bounce` animation (translateY 0 → 8px → 0, 1.6s infinite ease-in-out)

---

## 6. Hero 3D Object — Personal Logo

Ayoola's personal logo SVG (source: `/Users/ayoola/Desktop/hanl/src/components/layout/Footer.tsx`, inline `<svg viewBox="0 0 48 48">`) is a tall diamond polygon outline with 4 inner node points connected by lines.

**SVG vertices to extract:**
- Outer polygon path: `M20 6 L28 6 L32 10 L32 16 L30 20 L34 26 L32 34 L28 40 L24 42 L20 38 L16 32 L14 26 L16 20 L14 14 L16 10 Z`
- Inner node circles at: `(24,13)`, `(30,21)`, `(21,30)`, `(17,20)` (SVG coordinate space)
- Connection lines: `(24,13)→(30,21)`, `(30,21)→(21,30)`, `(17,20)→(24,13)`

**Three.js implementation:**
- Convert SVG coordinates to 3D: normalise from `[0,48]` to `[-1,1]`, Y axis flipped, Z = 0. Extrude `ExtrudeGeometry` depth `0.05` or keep flat with `ShapeGeometry`.
- Outer outline: `THREE.Line` (loop closed) with `LineBasicMaterial({ color: 0xffd700, opacity: 0.6, transparent: true })`
- Inner nodes: 4× `SphereGeometry(0.06, 8, 8)` at extracted vertex positions, `MeshBasicMaterial({ color: 0xffd700 })`
- Connection lines: `LineSegments` between node pairs, `LineBasicMaterial({ color: 0x4FC3F7, opacity: 0.5, transparent: true })`
- All objects in a `THREE.Group`
- Animation: `group.rotation.y += 0.004` per frame, `group.position.y = Math.sin(elapsed) * 0.08`
- Renderer: separate `<canvas id="logo-canvas">` inside the hero right column, `alpha: true`, `antialias: true`, no lights needed (MeshBasicMaterial)
- Rendered size: `220×220px` desktop, `120×120px` mobile

---

## 7. About Section

**Layout — desktop (≥ 768px):** CSS Grid, `grid-template-columns: 60% 40%`, `gap: 4rem`, `align-items: start`

**Left column:**
- Mono tag: `// WHO I AM` in `--text-muted`
- Headline across 3 lines: `Founder.` / `Builder.` / `Visionary.` (Bebas Neue, large)

**Right column:**
- 3–4 sentences body copy (placeholder: "Ayoola Morakinyo is a founder and software engineer building tools for the football industry. He is the creator of MDFLD, an AI-powered authentication platform. He works at the intersection of machine learning, product design, and sport.")
- Skill chips row (monospace, `--border` bordered pill): `Python · Next.js · Three.js · ML · Node.js`

**Mobile:** Single column; left content first, right content below.

**Scroll animation (desktop only):** Left column `gsap.from('.about-left', { x: -60, opacity: 0, duration: 0.8 })`, right column `gsap.from('.about-right', { y: 40, opacity: 0, duration: 0.8, delay: 0.15 })`. Both triggered at `start: "top 75%"`.

---

## 8. MDFLD Feature Section

Background: `#050505`. Gold accent throughout.

**Layout (desktop):** Free-flow with absolute-positioned large bg text behind content.
- Top bar: flex row, `MDFLD` badge left, `FLAGSHIP PROJECT` label right
- Large bg text: `MDFLD` absolutely positioned, `font-size: clamp(8rem, 20vw, 18rem)`, Bebas Neue, `color: rgba(255,215,0,0.04)`, `bottom: 0`, `right: -1rem`, `pointer-events: none`, `user-select: none`
- Main content: `max-width: 600px`
  - Headline: `Football Authentication Platform` (Bebas Neue, large)
  - Body: 2–3 sentences on what MDFLD solves and current stage
  - CTA: `<a href="https://beta.mdfld.co">VIEW PROJECT →</a>` in gold monospace

**Mobile:** same structure, bg text smaller, full-width content.

**Scroll animation (desktop only):** headline lines stagger in `{ y: 30, opacity: 0, stagger: 0.12 }`; bg text `{ opacity: 0, scale: 1.05 }` fades in; CTA `{ x: -20, opacity: 0 }` slides in last. All triggered at `start: "top 70%"`.

---

## 9. Other Projects Section

**Layout:** CSS Grid, `grid-template-columns: repeat(2, 1fr)` desktop, `1fr` mobile, `gap: 1.5rem`.

**Each card:**
```html
<a class="project-card" href="[url]">
  <span class="proj-tag">[CATEGORY · YEAR]</span>
  <h3 class="proj-name">[Name]</h3>
  <p class="proj-desc">[1–2 sentences]</p>
  <span class="proj-arrow">→</span>
</a>
```
- Border: `1px solid var(--border)`, `border-radius: 6px`, `padding: 1.5rem`
- Hover: `border-color: var(--gold)`, `box-shadow: 0 0 20px rgba(255,215,0,0.06)`, CSS `transition: 0.2s`
- Cards are `<a>` tags — entire card is clickable

**Initial projects:**
| Tag | Name | Description | URL |
|-----|------|-------------|-----|
| `FULL-STACK · 2025` | Allstar Kids Academy | Family portal and digital enrollment system for a childcare business | `#` (placeholder) |
| `DATA · 2025` | Boot Scraper | Multi-site scraper collecting training images for the MDFLD authentication model | `#` (placeholder) |

**Scroll animation (desktop only):** `gsap.from('.project-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.6 })` at `start: "top 80%"`.

---

## 10. Contact Section

Minimal. No form — just links.

**Layout — desktop:** Flex row, `justify-content: space-between`, `align-items: center`
- Left: heading `Let's talk.` (Bebas Neue, `clamp(2.5rem, 5vw, 5rem)`)
- Right: flex row of links in monospace, `gap: 2rem`

**Mobile:** Single column, heading above links.

**Links:** `EMAIL`, `LINKEDIN`, `GITHUB`, `TWITTER` — each `rgba(255,255,255,0.35)` default, `color: var(--gold)` on hover, CSS `transition: 0.2s`.

---

## 11. Custom Cursor (desktop only)

Hidden on touch/mobile (`@media (hover: none) { #cursor { display: none } }`). Default OS cursor hidden on `body` (`cursor: none`) only on desktop (`@media (hover: hover)`).

**DOM:** `<div id="cursor"></div>` — `position: fixed`, `pointer-events: none`, `z-index: 9999`, circle via `border-radius: 50%`

| State | Size | Style |
|-------|------|-------|
| Default | `16px` | `border: 1px solid rgba(255,255,255,0.6)`, no fill |
| Hover (on `a`, `button`) | `36px` | `border-color: var(--gold)`, `background: rgba(255,215,0,0.06)` |
| Click | `12px` | brief flash via JS class, 100ms |

**JS:** `mousemove` → update `transform: translate(x, y)`. CSS `transition: width 0.15s, height 0.15s, border-color 0.15s` handles morph. Hover class toggled via `mouseenter`/`mouseleave` on all `a` and `button` elements.

---

## 12. Scroll Animations

**Wiring:** Lenis must be connected to GSAP ScrollTrigger:
```js
import Lenis from 'lenis'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const lenis = new Lenis()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

**All animations disabled on mobile** (`window.innerWidth < 768`): skip GSAP setup entirely on mobile; elements start at their final visible state via CSS.

**`prefers-reduced-motion`:** Wrap all GSAP animation calls in:
```js
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // set up ScrollTrigger animations
}
```

| Element | GSAP call |
|---------|-----------|
| Hero name chars | `gsap.from(chars, { opacity: 0, y: 20, stagger: 0.03, duration: 0.6, delay: 0.2 })` on load |
| About headline words | `gsap.from(words, { x: -40, opacity: 0, stagger: 0.08, duration: 0.7 })` |
| About body | `gsap.from(el, { y: 30, opacity: 0, duration: 0.7, delay: 0.15 })` |
| MDFLD headline lines | `gsap.from(lines, { y: 30, opacity: 0, stagger: 0.12, duration: 0.8 })` |
| MDFLD bg text | `gsap.from(el, { opacity: 0, scale: 1.05, duration: 1 })` |
| MDFLD CTA | `gsap.from(el, { x: -20, opacity: 0, duration: 0.6, delay: 0.4 })` |
| Project cards | `gsap.from(cards, { y: 40, opacity: 0, stagger: 0.1, duration: 0.6 })` |
| Contact heading | `gsap.from(el, { x: -40, opacity: 0, duration: 0.7 })` |

All use `trigger: sectionEl, start: "top 75%"` except project cards (`start: "top 80%"`).

---

## 13. SEO / Meta

In `index.html` `<head>`:
```html
<title>Ayoola Morakinyo — Founder & Builder</title>
<meta name="description" content="Ayoola Morakinyo — Founder of MDFLD, software engineer, building tools for the football industry." />
<meta property="og:title" content="Ayoola Morakinyo" />
<meta property="og:description" content="Founder of MDFLD. Builder. Atlanta." />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary" />
```

---

## 14. Tech Stack

| Concern | Library |
|---------|---------|
| 3D hero logo | Three.js (latest via npm) |
| Background canvas | Vanilla Canvas 2D |
| Scroll animations | GSAP + ScrollTrigger plugin |
| Smooth scroll | Lenis |
| Custom cursor | Vanilla JS + CSS |
| Bundler | Vite (existing) |
| Language | Vanilla JS ES modules, no framework |

**Packages to add:** `gsap`, `lenis` (via npm). `three` already installed.
**Packages to remove:** `@dimforge/rapier3d-compat`.

---

## 15. File Structure

`index.html` lives at the **project root** (standard Vite convention).

```
index.html                     — single page, all five sections, Bebas Neue font link
src/
  main.js                      — init all modules, tie together
  canvas/
    BackgroundCanvas.js        — grain + particle rAF loop
  hero/
    HeroLogo.js                — Three.js personal logo (SVG → 3D)
  cursor/
    Cursor.js                  — custom cursor (desktop only)
  scroll/
    SmoothScroll.js            — Lenis init + GSAP ticker wiring
    Animations.js              — all ScrollTrigger setups
  sections/
    hero.js                    — scroll indicator bounce, hero init
    about.js                   — about section JS (if needed)
    mdfld.js                   — MDFLD section JS (if needed)
    projects.js                — project cards hover logic
    contact.js                 — contact links (minimal)
  style.css                    — global styles, CSS variables, section layouts
```

**Delete from existing `src/`:** `physics/`, `controls/`, `zones/`, `npcs/`, `audio/`, `ui/`, `scene/`, `data/`, `utils/` — everything except `main.js` (which is fully replaced).

---

## 16. Out of Scope

- Mobile animations (disabled; elements visible from paint)
- CMS or dynamic content (all copy hardcoded)
- Blog, writing section, case studies
- Any physics simulation
- Touch gesture handling beyond scroll
- Dark/light mode toggle

---

## 17. Success Criteria

1. Hero section text, canvas, and 3D logo are all visible and animated within 2 seconds on a 10 Mbps connection (measured in Chrome DevTools Network tab, Fast 3G simulation)
2. Background canvas renders grain + particles on first paint, before any scroll
3. Personal logo rotates continuously in the hero
4. All five sections present; all scroll-triggered animations fire correctly on desktop Chrome
5. Custom cursor visible and reactive on desktop; hidden on mobile/touch
6. MDFLD CTA links to `https://beta.mdfld.co`
7. Zero console errors on load
8. Page renders correctly on Chrome, Safari, Firefox (desktop)
9. `prefers-reduced-motion: reduce` disables all GSAP animations; page still fully readable
