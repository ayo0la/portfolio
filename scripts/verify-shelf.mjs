// Rendered verification for the 3D Other Work shelf. Not part of `npm test`.
//   node scripts/verify-shelf.mjs [--url http://localhost:4173/] [--out DIR] [--only shots,timing,reduced]
//        [--runs 5]   (--out defaults to a temp dir)
// Fails (exit 1) on any console error or page error. Timing samples 120 animation frames of hover
// and open at 1440x900, DPR 2, on the real GPU (Metal ANGLE) and prints median and worst frame ms.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const arg = (name, d) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : d }
const URL_ = arg('url', 'http://localhost:4173/')
const OUT = arg('out', join(tmpdir(), 'verify-shelf-out'))
const ONLY = new Set(arg('only', 'shots,timing,reduced').split(','))
const RUNS = Number(arg('runs', '1'))
mkdirSync(OUT, { recursive: true })

const SLUGS = ['square-a', 'upstream', 'allstar-kids', 'npm', 'matchday', 'math-trail', 'chess-rivals', 'client-sites']
// record centres as fractions of the 1440x900 canvas, from the shelf at rest
const GRID = [
  [0.224, 0.245], [0.414, 0.245], [0.583, 0.245], [0.772, 0.245],
  [0.238, 0.578], [0.421, 0.578], [0.586, 0.578], [0.751, 0.578],
]
const ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
const errors = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ headless: true, args: ARGS })

async function page(ctxOpts, tag) {
  const ctx = await browser.newContext(ctxOpts)
  const p = await ctx.newPage()
  const note = (kind, msg) => errors.push(`[${tag}] ${kind}: ${msg}`)
  p.on('pageerror', (e) => note('pageerror', e.message))
  p.on('console', (m) => { if (m.type() === 'error') note('console', m.text()) })
  return { ctx, p }
}

// preScroll=false loads the URL and leaves the page where the site itself puts it (deep links)
async function toShelf(p, hash = '', preScroll = true) {
  await p.goto(URL_ + hash, { waitUntil: 'load' })
  if (preScroll) await p.evaluate(() => document.querySelector('#projects').scrollIntoView())
  await p.waitForSelector('#shelf-3d canvas', { timeout: 60000 })
  await sleep(5500)
  return (await (await p.$('#shelf-3d canvas')).boundingBox())
}

const openBy = async (p, slug) => { await p.evaluate((s) => { location.hash = `#work/${s}` }, slug); await sleep(2800) }
const closeIt = async (p) => { await p.keyboard.press('Escape'); await sleep(1500) }

async function shots() {
  for (const scheme of ['dark', 'light']) {
    for (const phone of [false, true]) {
      const tag = `${phone ? 'phone' : 'desktop'}-${scheme}`
      const { ctx, p } = await page({
        viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        deviceScaleFactor: 2, colorScheme: scheme, isMobile: phone, hasTouch: phone,
      }, tag)
      const box = await toShelf(p)
      await p.screenshot({ path: `${OUT}/${tag}-shelf.png` })
      if (!phone) {
        for (let i = 0; i < 8; i++) {
          await p.mouse.move(box.x + box.width * GRID[i][0], box.y + box.height * GRID[i][1], { steps: 4 })
          await sleep(1800)
          await p.screenshot({ path: `${OUT}/${tag}-hover-${SLUGS[i]}.png` })
        }
        await p.mouse.move(2, 2)
        await sleep(600)
      }
      for (const slug of SLUGS) {
        await openBy(p, slug)
        await p.screenshot({ path: `${OUT}/${tag}-open-${slug}.png` })
        await p.click('button[aria-label="Flip the record"]')
        await sleep(2200)
        await p.screenshot({ path: `${OUT}/${tag}-flip-${slug}.png` })
        await closeIt(p)
      }
      const left = await p.evaluate(() => location.hash)
      if (left.startsWith('#work/')) errors.push(`[${tag}] Escape did not clear the hash (${left})`)
      await ctx.close()
    }
  }
  // deep links: load the URL and do NOT scroll to #projects ourselves
  for (const phone of [false, true]) {
    const tag = phone ? 'deeplink-phone' : 'deeplink'
    const { ctx, p } = await page({
      viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      deviceScaleFactor: 2, colorScheme: 'dark', isMobile: phone, hasTouch: phone,
    }, tag)
    await toShelf(p, '#work/matchday', false)
    const hasPanel = await p.evaluate(() => !!document.querySelector('[aria-label="Matchday"]'))
    if (!hasPanel) errors.push(`[${tag}] #work/matchday did not open the Matchday panel`)
    await p.screenshot({ path: `${OUT}/${tag}-matchday.png` })
    await ctx.close()
  }
}

// 120 rAF intervals in ms
const frames = (p, n = 120) => p.evaluate((n) => new Promise((res) => {
  const d = []; let last = performance.now()
  const f = (t) => { d.push(t - last); last = t; if (d.length < n) requestAnimationFrame(f); else res(d) }
  requestAnimationFrame(f)
}), n)
const stat = (d) => { const s = [...d].sort((a, b) => a - b); return { median: +s[s.length >> 1].toFixed(1), worst: +s[s.length - 1].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1) } }

async function timing() {
  const rows = []
  for (let r = 0; r < RUNS; r++) {
    const { ctx, p } = await page({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' }, `timing-${r}`)
    const box = await toShelf(p)
    const idle = stat(await frames(p))
    // first hover on a fresh page, sampled from the instant the pointer lands
    await p.mouse.move(box.x + box.width * GRID[2][0], box.y + box.height * GRID[2][1], { steps: 2 })
    const first = stat(await frames(p, 60))
    await sleep(1200)
    const hover = stat(await frames(p))
    await p.mouse.click(box.x + box.width * GRID[2][0], box.y + box.height * GRID[2][1])
    await sleep(2500)
    const open = stat(await frames(p))
    const canvasW = await p.evaluate(() => document.querySelector('#shelf-3d canvas').width)
    rows.push({ run: r + 1, idle, firstHover: first, hover, open, canvasW })
    await ctx.close()
  }
  console.log('TIMING (ms per frame, desktop 1440x900 @2x)')
  console.table(rows.map((x) => ({ run: x.run, canvasW: x.canvasW, idleMed: x.idle.median, idleWorst: x.idle.worst, firstHoverMed: x.firstHover.median, firstHoverWorst: x.firstHover.worst, hoverMed: x.hover.median, hoverWorst: x.hover.worst, openMed: x.open.median, openWorst: x.open.worst, openFps: +(1000 / x.open.median).toFixed(0) })))
  return rows
}

async function reduced() {
  const { ctx, p } = await page({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce' }, 'reduced')
  await p.goto(URL_, { waitUntil: 'load' })
  await p.evaluate(() => document.querySelector('#projects').scrollIntoView())
  await sleep(1500)
  if (await p.$('#shelf-3d canvas')) errors.push('[reduced] 3D canvas mounted under prefers-reduced-motion')
  const cards = await p.$$('.shelf-card[data-flipped]')
  if (cards.length !== 8) errors.push(`[reduced] expected 8 2D cards, found ${cards.length}`)
  let i = 0
  for (const c of cards) {
    await c.scrollIntoViewIfNeeded()
    await c.screenshot({ path: `${OUT}/reduced-${i}-front.png` })
    await c.click()
    await sleep(900)
    if ((await c.getAttribute('data-flipped')) !== 'true') errors.push(`[reduced] card ${i} did not flip`)
    await c.screenshot({ path: `${OUT}/reduced-${i}-back.png` })
    await p.mouse.click(2, 2)
    await sleep(300)
    i++
  }
  await ctx.close()
}

if (ONLY.has('shots')) await shots()
let rows = []
if (ONLY.has('timing')) rows = await timing()
if (ONLY.has('reduced')) await reduced()
await browser.close()

console.log(errors.length ? `FAIL: ${errors.length} problem(s)\n${errors.join('\n')}` : 'OK: no console errors, no page errors')
process.exit(errors.length ? 1 : 0)
