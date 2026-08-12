import { describe, it, expect } from 'vitest'
import { renderEpisodeHtml, renderIndexHtml } from '../scripts/podcast-templates.js'

const episode = {
  slug: 'week-of-aug-11',
  title: 'Week of Aug 11: shipping voice learning',
  date: '2026-08-14',
  dateDisplay: 'August 14, 2026',
  tldr: 'N-rol voice learning shipped, resume ATS scores went from 0 to real numbers.',
  audio: '2026-08-14-week-of-aug-11.mp3',
  hasAudio: true,
  html: '<h2>What shipped</h2><p>Some <strong>bold</strong> text.</p>',
}

describe('renderEpisodeHtml', () => {
  it('includes the title', () => {
    expect(renderEpisodeHtml(episode)).toContain('Week of Aug 11: shipping voice learning')
  })

  it('includes the formatted date', () => {
    expect(renderEpisodeHtml(episode)).toContain('August 14, 2026')
  })

  it('includes the converted markdown body', () => {
    const html = renderEpisodeHtml(episode)
    expect(html).toContain('<h2>What shipped</h2>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('links back to the portfolio home page', () => {
    expect(renderEpisodeHtml(episode)).toContain('href="/"')
  })

  it('links both the shared blog stylesheet and the podcast stylesheet', () => {
    const html = renderEpisodeHtml(episode)
    expect(html).toContain('/blog/blog.css')
    expect(html).toContain('/podcast/podcast.css')
  })

  it('renders an audio player with the correct src when audio exists', () => {
    const html = renderEpisodeHtml(episode)
    expect(html).toContain('<audio')
    expect(html).toContain('src="/podcast/audio/2026-08-14-week-of-aug-11.mp3"')
  })

  it('renders a not-yet-published note instead of a player when audio is missing', () => {
    const html = renderEpisodeHtml({ ...episode, hasAudio: false })
    expect(html).not.toContain('<audio')
    expect(html).toContain('not yet published')
  })

  it('escapes HTML special characters in title', () => {
    const html = renderEpisodeHtml({ ...episode, title: 'Some <script>alert(1)</script> & more' })
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).not.toContain('<script>')
  })

  it('escapes HTML special characters in the audio filename used as an attribute', () => {
    const html = renderEpisodeHtml({ ...episode, audio: '"><script>alert(1)</script>.mp3' })
    expect(html).not.toContain('"><script>')
  })

  it('does not escape the raw HTML body', () => {
    const html = renderEpisodeHtml(episode)
    expect(html).toContain('<h2>What shipped</h2>')
    expect(html).toContain('<strong>bold</strong>')
  })
})

describe('renderIndexHtml', () => {
  it('links to each episode by slug', () => {
    expect(renderIndexHtml([episode])).toContain('href="/podcast/week-of-aug-11/"')
  })

  it('includes title, date, and tldr for each episode', () => {
    const html = renderIndexHtml([episode])
    expect(html).toContain('Week of Aug 11: shipping voice learning')
    expect(html).toContain('August 14, 2026')
    expect(html).toContain('N-rol voice learning shipped, resume ATS scores went from 0 to real numbers.')
  })

  it('renders an empty list without throwing', () => {
    expect(() => renderIndexHtml([])).not.toThrow()
  })

  it('escapes HTML special characters in episode title', () => {
    const html = renderIndexHtml([{ ...episode, title: 'Some <script>alert(1)</script> & more' }])
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
