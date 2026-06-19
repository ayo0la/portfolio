import { describe, it, expect } from 'vitest'
import { renderPostHtml, renderIndexHtml } from '../scripts/blog-templates.js'

const post = {
  slug: 'fgvm-first-results',
  title: 'First results from FGVM',
  date: '2026-06-20',
  dateDisplay: 'June 20, 2026',
  tldr: 'Early accuracy numbers and what surprised me.',
  html: '<h2>What I tried</h2><p>Some <strong>bold</strong> text.</p>',
}

describe('renderPostHtml', () => {
  const html = renderPostHtml(post)

  it('includes the title', () => {
    expect(html).toContain('First results from FGVM')
  })

  it('includes the formatted date', () => {
    expect(html).toContain('June 20, 2026')
  })

  it('includes the converted markdown body', () => {
    expect(html).toContain('<h2>What I tried</h2>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('links back to the portfolio home page', () => {
    expect(html).toContain('href="/"')
  })

  it('links the blog stylesheet', () => {
    expect(html).toContain('/blog/blog.css')
  })
})

describe('renderIndexHtml', () => {
  const html = renderIndexHtml([post])

  it('links to each post by slug', () => {
    expect(html).toContain('href="/blog/fgvm-first-results/"')
  })

  it('includes title, date, and tldr for each post', () => {
    expect(html).toContain('First results from FGVM')
    expect(html).toContain('June 20, 2026')
    expect(html).toContain('Early accuracy numbers and what surprised me.')
  })

  it('renders an empty list without throwing', () => {
    expect(() => renderIndexHtml([])).not.toThrow()
  })
})

describe('HTML escaping in renderPostHtml', () => {
  it('escapes HTML special characters in title', () => {
    const maliciousPost = {
      slug: 'test',
      title: 'Some <script>alert(1)</script> & more',
      dateDisplay: 'June 20, 2026',
      html: '<p>Safe content</p>',
    }
    const html = renderPostHtml(maliciousPost)
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('<script>')
  })

  it('escapes HTML special characters in dateDisplay', () => {
    const maliciousPost = {
      slug: 'test',
      title: 'Safe title',
      dateDisplay: 'June <20>, 2026 & more',
      html: '<p>Safe content</p>',
    }
    const html = renderPostHtml(maliciousPost)
    expect(html).toContain('&lt;20&gt;')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('<20>')
  })

  it('does not escape the raw HTML body', () => {
    const post = {
      slug: 'test',
      title: 'Safe title',
      dateDisplay: 'June 20, 2026',
      html: '<h2>Raw HTML</h2><strong>should</strong> stay raw',
    }
    const html = renderPostHtml(post)
    expect(html).toContain('<h2>Raw HTML</h2>')
    expect(html).toContain('<strong>should</strong>')
  })
})

describe('HTML escaping in renderIndexHtml', () => {
  it('escapes HTML special characters in post title', () => {
    const maliciousPost = {
      slug: 'test',
      title: 'Some <script>alert(1)</script> & more',
      dateDisplay: 'June 20, 2026',
      tldr: 'Safe summary',
      html: '<p>Safe content</p>',
    }
    const html = renderIndexHtml([maliciousPost])
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('<script>')
  })

  it('escapes HTML special characters in dateDisplay and tldr', () => {
    const maliciousPost = {
      slug: 'test',
      title: 'Safe title',
      dateDisplay: 'June <20>, 2026',
      tldr: 'Summary with <tag> & ampersand',
      html: '<p>Safe content</p>',
    }
    const html = renderIndexHtml([maliciousPost])
    expect(html).toContain('&lt;20&gt;')
    expect(html).toContain('&lt;tag&gt;')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('<20>')
    expect(html).not.toContain('<tag>')
  })
})
