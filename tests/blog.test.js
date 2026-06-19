import { describe, it, expect, beforeEach } from 'vitest'
import { initBlog } from '../src/sections/blog.js'

const makePost = (overrides = {}) => ({
  slug: 'fgvm-first-results',
  title: 'First results from FGVM',
  dateDisplay: 'June 20, 2026',
  tldr: 'Early accuracy numbers and what surprised me.',
  ...overrides,
})

beforeEach(() => {
  document.body.innerHTML = `
    <section id="blog">
      <div class="section-inner">
        <span class="mono-tag section-tag">// BLOG</span>
        <div id="blog-cards" class="projects-grid"></div>
        <a class="blog-viewall" href="/blog/">View all posts →</a>
      </div>
    </section>
  `
})

describe('initBlog', () => {
  it('renders a card per post', () => {
    initBlog([makePost(), makePost({ slug: 'second', title: 'Second post' })])
    const cards = document.querySelectorAll('#blog-cards .project-card')
    expect(cards).toHaveLength(2)
  })

  it('renders title, date, and tldr on each card', () => {
    initBlog([makePost()])
    const card = document.querySelector('#blog-cards .project-card')
    expect(card.querySelector('.proj-name').textContent).toBe('First results from FGVM')
    expect(card.querySelector('.proj-tag').textContent).toBe('June 20, 2026')
    expect(card.querySelector('.proj-desc').textContent).toBe('Early accuracy numbers and what surprised me.')
  })

  it('links each card to its post page', () => {
    initBlog([makePost()])
    const card = document.querySelector('#blog-cards .project-card')
    expect(card.getAttribute('href')).toBe('/blog/fgvm-first-results/')
  })

  it('removes the whole section when there are no posts', () => {
    initBlog([])
    expect(document.getElementById('blog')).toBeNull()
  })

  it('does nothing when the section is not present in the DOM', () => {
    document.body.innerHTML = ''
    expect(() => initBlog([makePost()])).not.toThrow()
  })

  it('escapes HTML special characters in the title so they render as text, not markup', () => {
    initBlog([makePost({ title: 'Some <em>x</em> & "stuff"' })])
    const card = document.querySelector('#blog-cards .project-card')
    expect(card.querySelector('.proj-name').querySelector('em')).toBeNull()
    expect(card.querySelector('.proj-name').textContent).toBe('Some <em>x</em> & "stuff"')
  })
})
