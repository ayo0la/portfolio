import { describe, it, expect } from 'vitest'
import { parseEpisode, sortByDateDesc, toIndexEntries } from '../scripts/podcast-transform.js'

const RAW = `---
title: "Week of Aug 11: shipping voice learning"
date: 2026-08-14
tldr: "N-rol voice learning shipped, resume ATS scores went from 0 to real numbers."
audio: "2026-08-14-week-of-aug-11.mp3"
---

## What shipped

Some **bold** text.
`

describe('parseEpisode', () => {
  it('strips the date prefix from the filename to produce the slug', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.slug).toBe('week-of-aug-11')
  })

  it('reads title and tldr from frontmatter', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.title).toBe('Week of Aug 11: shipping voice learning')
    expect(episode.tldr).toBe('N-rol voice learning shipped, resume ATS scores went from 0 to real numbers.')
  })

  it('reads the audio filename from frontmatter', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.audio).toBe('2026-08-14-week-of-aug-11.mp3')
  })

  it('formats the display date in UTC regardless of local timezone', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.dateDisplay).toBe('August 14, 2026')
  })

  it('keeps date as a sortable ISO date string', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.date).toBe('2026-08-14')
  })

  it('converts the markdown body to HTML', () => {
    const episode = parseEpisode('2026-08-14-week-of-aug-11.md', RAW)
    expect(episode.html).toContain('<h2>What shipped</h2>')
    expect(episode.html).toContain('<strong>bold</strong>')
  })

  it('handles a filename with no date prefix', () => {
    const episode = parseEpisode('week-of-aug-11.md', RAW)
    expect(episode.slug).toBe('week-of-aug-11')
  })
})

describe('sortByDateDesc', () => {
  it('sorts episodes newest first', () => {
    const episodes = [
      { date: '2026-01-01' },
      { date: '2026-08-14' },
      { date: '2026-03-15' },
    ]
    const sorted = sortByDateDesc(episodes)
    expect(sorted.map(e => e.date)).toEqual(['2026-08-14', '2026-03-15', '2026-01-01'])
  })

  it('does not mutate the input array', () => {
    const episodes = [{ date: '2026-01-01' }, { date: '2026-08-14' }]
    sortByDateDesc(episodes)
    expect(episodes[0].date).toBe('2026-01-01')
  })
})

describe('toIndexEntries', () => {
  const episodes = [
    { slug: 'a', title: 'A', date: '2026-03-01', dateDisplay: 'March 1, 2026', tldr: 'tldr a', hasAudio: true, html: '<p>a</p>', audio: 'a.mp3' },
    { slug: 'b', title: 'B', date: '2026-02-01', dateDisplay: 'February 1, 2026', tldr: 'tldr b', hasAudio: false, html: '<p>b</p>', audio: 'b.mp3' },
    { slug: 'c', title: 'C', date: '2026-01-01', dateDisplay: 'January 1, 2026', tldr: 'tldr c', hasAudio: true, html: '<p>c</p>', audio: 'c.mp3' },
  ]

  it('limits to the given number of entries, defaulting to 3', () => {
    expect(toIndexEntries(episodes)).toHaveLength(3)
    expect(toIndexEntries(episodes, 2)).toHaveLength(2)
  })

  it('strips html and audio filename from the output shape, keeps hasAudio', () => {
    const [entry] = toIndexEntries(episodes, 1)
    expect(entry).toEqual({ slug: 'a', title: 'A', date: '2026-03-01', dateDisplay: 'March 1, 2026', tldr: 'tldr a', hasAudio: true })
  })
})
