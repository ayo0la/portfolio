import { describe, it, expect } from 'vitest'
import { renderRss, renderSitemap, renderHomeBlogCards, injectHomeBlogCards, SITE_URL } from '../scripts/site-feeds.js'

const posts = [
  { slug: 'second', title: 'Second & last', date: '2026-09-20', dateDisplay: 'September 20, 2026', tldr: 'Newer <one>.' },
  { slug: 'first', title: 'First', date: '2026-08-09', dateDisplay: 'August 9, 2026', tldr: 'Older.' },
]

describe('renderRss', () => {
  const xml = renderRss(posts)

  it('has one escaped item per post with absolute links', () => {
    expect(xml.match(/<item>/g).length).toBe(2)
    expect(xml).toContain(`<link>${SITE_URL}/blog/second/</link>`)
    expect(xml).toContain('<title>Second &amp; last</title>')
    expect(xml).toContain('Newer &lt;one&gt;.')
  })

  it('uses RFC 822 dates', () => {
    expect(xml).toContain('<pubDate>Sun, 20 Sep 2026 00:00:00 GMT</pubDate>')
  })
})

describe('renderSitemap', () => {
  it('lists home, the blog index, and every post', () => {
    const xml = renderSitemap(posts)
    for (const path of ['/', '/blog/', '/blog/second/', '/blog/first/']) {
      expect(xml).toContain(`<loc>${SITE_URL}${path}</loc>`)
    }
    expect(xml).toContain('<lastmod>2026-09-20</lastmod>')
  })
})

describe('home blog cards', () => {
  it('renders the same card markup the page script uses', () => {
    const cards = renderHomeBlogCards(posts)
    expect(cards).toContain('<a class="project-card" href="/blog/second/">')
    expect(cards).toContain('Second &amp; last')
  })

  it('replaces only the content of the blog-cards container', () => {
    const page = '<p>a</p><div id="blog-cards" class="projects-grid">old</div><p>b</p>'
    const out = injectHomeBlogCards(page, posts)
    expect(out.startsWith('<p>a</p><div id="blog-cards" class="projects-grid">')).toBe(true)
    expect(out.endsWith('</div><p>b</p>')).toBe(true)
    expect(out).not.toContain('old')
    expect(injectHomeBlogCards(out, posts)).toBe(out)
  })
})
