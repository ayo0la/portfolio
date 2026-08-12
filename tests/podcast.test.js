import { describe, it, expect, beforeEach } from 'vitest'
import { initPodcast } from '../src/sections/podcast.js'

const makeEpisode = (overrides = {}) => ({
  slug: 'week-of-aug-11',
  title: 'Week of Aug 11: shipping voice learning',
  dateDisplay: 'August 14, 2026',
  tldr: 'N-rol voice learning shipped, resume ATS scores went from 0 to real numbers.',
  hasAudio: true,
  ...overrides,
})

beforeEach(() => {
  document.body.innerHTML = `
    <section id="podcast">
      <div class="section-inner">
        <span class="mono-tag section-tag">// PODCAST</span>
        <div id="podcast-cards" class="projects-grid"></div>
        <a class="blog-viewall" href="/podcast/">View all episodes →</a>
      </div>
    </section>
  `
})

describe('initPodcast', () => {
  it('renders a card per episode', () => {
    initPodcast([makeEpisode(), makeEpisode({ slug: 'second', title: 'Second episode' })])
    const cards = document.querySelectorAll('#podcast-cards .project-card')
    expect(cards).toHaveLength(2)
  })

  it('renders title, date, and tldr on each card', () => {
    initPodcast([makeEpisode()])
    const card = document.querySelector('#podcast-cards .project-card')
    expect(card.querySelector('.proj-name').textContent).toBe('Week of Aug 11: shipping voice learning')
    expect(card.querySelector('.proj-tag').textContent).toBe('August 14, 2026')
    expect(card.querySelector('.proj-desc').textContent).toBe('N-rol voice learning shipped, resume ATS scores went from 0 to real numbers.')
  })

  it('links each card to its episode page', () => {
    initPodcast([makeEpisode()])
    const card = document.querySelector('#podcast-cards .project-card')
    expect(card.getAttribute('href')).toBe('/podcast/week-of-aug-11/')
  })

  it('removes the whole section when there are no episodes', () => {
    initPodcast([])
    expect(document.getElementById('podcast')).toBeNull()
  })

  it('does nothing when the section is not present in the DOM', () => {
    document.body.innerHTML = ''
    expect(() => initPodcast([makeEpisode()])).not.toThrow()
  })

  it('escapes HTML special characters in the title so they render as text, not markup', () => {
    initPodcast([makeEpisode({ title: 'Some <em>x</em> & "stuff"' })])
    const card = document.querySelector('#podcast-cards .project-card')
    expect(card.querySelector('.proj-name').querySelector('em')).toBeNull()
    expect(card.querySelector('.proj-name').textContent).toBe('Some <em>x</em> & "stuff"')
  })
})
