// Screenshots the real products and writes the WebP covers under public/covers/live.
// Usage: node scripts/capture-covers.mjs [name ...]
import { chromium } from 'playwright'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { blankFraction, BLANK_LIMIT } from './blank-fraction.js'
import { COVER_TARGETS, VIEWPORT, SCALE } from './covers-config.js'

const outDir = path.resolve(import.meta.dirname, '../public/covers/live')
fs.mkdirSync(outDir, { recursive: true })
const only = process.argv.slice(2)
const targets = COVER_TARGETS.filter((t) => !only.length || only.includes(t.out))

let failed = false
const browser = await chromium.launch()
for (const t of targets) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE })
  const page = await ctx.newPage()
  try {
    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 45000 })
    } catch (e) {
      if (/ERR_CONNECTION|ENOTFOUND|ERR_NAME|ECONNREFUSED/.test(String(e))) throw e
      await page.goto(t.url, { waitUntil: 'load', timeout: 45000 })
    }
    if (t.click) await page.getByText(t.click).first().click()
    await page.waitForTimeout(t.click ? 3000 : 1500)
    // Scroll through the page to trigger reveal-on-scroll animations, then settle at the top.
    const total = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y <= total + 400; y += 400) {
      await page.evaluate((v) => window.scrollTo(0, v), y)
      await page.waitForTimeout(150)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(1000)
    const png = await page.screenshot({ fullPage: true })
    const tallSharp = sharp(png).resize({ width: t.width })
    const resized = await tallSharp.toBuffer({ resolveWithObject: true })
    const h = Math.min(resized.info.height, t.maxHeight || 2048)
    const tall = sharp(resized.data).extract({ left: 0, top: 0, width: t.width, height: h })
    await tall.clone().webp({ quality: 72 }).toFile(path.join(outDir, `${t.out}-tall.webp`))
    if (t.still) {
      const s = Math.min(512, h)
      await tall.clone().extract({ left: 0, top: 0, width: 512, height: s }).webp({ quality: 78 })
        .toFile(path.join(outDir, `${t.out}.webp`))
    }
    const frac = await blankFraction(path.join(outDir, `${t.out}-tall.webp`))
    if (frac > BLANK_LIMIT) {
      console.warn(`BLANK ${t.out}: ${(frac * 100).toFixed(0)}% blank rows (limit ${BLANK_LIMIT * 100}%)`)
      failed = true
    }
    console.log(`ok   ${t.out} (${t.width}x${h})`)
  } catch (e) {
    console.warn(`SKIP ${t.out}: ${t.url} unreachable (${String(e.message).split('\n')[0]}); keeping any existing file`)
  } finally {
    await ctx.close()
  }
}
await browser.close()
if (failed) process.exit(1)
