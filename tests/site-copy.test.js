import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://ayoola-morakinyo.vercel.app'

let html, doc

beforeAll(() => {
  html = readFileSync(join(root, 'index.html'), 'utf8')
  doc = new DOMParser().parseFromString(html, 'text/html')
})

const meta = sel => doc.querySelector(sel)?.getAttribute('content')

describe('homepage copy', () => {
  it('uses a plain headline under the name', () => {
    expect(doc.querySelector('.hero-sub').textContent.trim()).toBe('FOUNDER · ML ENGINEER · ATLANTA')
  })

  it('drops inside jargon from visible copy and previews', () => {
    expect(html).not.toMatch(/overlord/i)
    expect(html).not.toContain('C.V Nerd')
    expect(html).not.toContain('Currently in prod.')
  })

  it('has no em dashes in the title or descriptions', () => {
    expect(doc.title).not.toContain('—')
    expect(meta('meta[name="description"]')).not.toContain('—')
  })

  it('lists TypeScript alongside the ML stack', () => {
    const chips = [...doc.querySelectorAll('.skill-chips .chip')].map(c => c.textContent.trim())
    expect(chips).toContain('TypeScript')
  })
})

describe('link previews', () => {
  it('ships a large preview image with absolute URLs', () => {
    expect(meta('meta[property="og:image"]')).toBe(`${SITE}/og.png`)
    expect(meta('meta[property="og:url"]')).toBe(`${SITE}/`)
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(doc.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`${SITE}/`)
  })

  it('has the preview image on disk', () => {
    expect(existsSync(join(root, 'public/og.png'))).toBe(true)
  })

  it('advertises the blog feed', () => {
    expect(doc.querySelector('link[type="application/rss+xml"]').getAttribute('href')).toBe('/rss.xml')
  })
})

describe('paused Audio Blog', () => {
  it('is not on the homepage', () => {
    expect(doc.getElementById('podcast')).toBeNull()
    expect(html).not.toContain('/podcast/')
  })

  it('is not built or linked from posts', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.scripts.prebuild).not.toContain('build-podcast')
    const post = readFileSync(join(root, 'content/blog/2026-08-16-mine-to-solve.md'), 'utf8')
    expect(post).not.toContain('Audio Blog')
  })
})

describe('crawlers and missing pages', () => {
  it('has robots.txt pointing at the sitemap', () => {
    expect(readFileSync(join(root, 'public/robots.txt'), 'utf8')).toContain(`Sitemap: ${SITE}/sitemap.xml`)
  })

  it('has a custom 404 page that links home', () => {
    const page = readFileSync(join(root, 'public/404.html'), 'utf8')
    expect(page).toContain('href="/"')
    expect(page).toContain('href="/blog/"')
  })
})

describe('homepage blog list without JavaScript', () => {
  it('ships the latest posts in the HTML', () => {
    const posts = JSON.parse(readFileSync(join(root, 'src/data/blog-index.json'), 'utf8'))
    const cards = doc.querySelectorAll('#blog-cards a.project-card')
    expect(cards.length).toBe(posts.length)
    expect(cards[0].getAttribute('href')).toBe(`/blog/${posts[0].slug}/`)
  })
})
