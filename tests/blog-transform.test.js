import { describe, it, expect } from 'vitest'
import { parsePost, sortByDateDesc, toIndexEntries } from '../scripts/blog-transform.js'

const RAW = `---
title: "First results from FGVM"
date: 2026-06-20
tldr: "Early accuracy numbers and what surprised me."
---

## What I tried

Some **bold** text.
`

describe('parsePost', () => {
  it('strips the date prefix from the filename to produce the slug', () => {
    const post = parsePost('2026-06-20-fgvm-first-results.md', RAW)
    expect(post.slug).toBe('fgvm-first-results')
  })

  it('reads title and tldr from frontmatter', () => {
    const post = parsePost('2026-06-20-fgvm-first-results.md', RAW)
    expect(post.title).toBe('First results from FGVM')
    expect(post.tldr).toBe('Early accuracy numbers and what surprised me.')
  })

  it('formats the display date in UTC regardless of local timezone', () => {
    const post = parsePost('2026-06-20-fgvm-first-results.md', RAW)
    expect(post.dateDisplay).toBe('June 20, 2026')
  })

  it('keeps date as a sortable ISO date string', () => {
    const post = parsePost('2026-06-20-fgvm-first-results.md', RAW)
    expect(post.date).toBe('2026-06-20')
  })

  it('converts the markdown body to HTML', () => {
    const post = parsePost('2026-06-20-fgvm-first-results.md', RAW)
    expect(post.html).toContain('<h2>What I tried</h2>')
    expect(post.html).toContain('<strong>bold</strong>')
  })

  it('handles a filename with no date prefix', () => {
    const post = parsePost('some-other-thought.md', RAW)
    expect(post.slug).toBe('some-other-thought')
  })
})

describe('sortByDateDesc', () => {
  it('sorts posts newest first', () => {
    const posts = [
      { date: '2026-01-01' },
      { date: '2026-06-20' },
      { date: '2026-03-15' },
    ]
    const sorted = sortByDateDesc(posts)
    expect(sorted.map(p => p.date)).toEqual(['2026-06-20', '2026-03-15', '2026-01-01'])
  })

  it('does not mutate the input array', () => {
    const posts = [{ date: '2026-01-01' }, { date: '2026-06-20' }]
    sortByDateDesc(posts)
    expect(posts[0].date).toBe('2026-01-01')
  })
})

describe('toIndexEntries', () => {
  const posts = [
    { slug: 'a', title: 'A', date: '2026-03-01', dateDisplay: 'March 1, 2026', tldr: 'tldr a', html: '<p>a</p>' },
    { slug: 'b', title: 'B', date: '2026-02-01', dateDisplay: 'February 1, 2026', tldr: 'tldr b', html: '<p>b</p>' },
    { slug: 'c', title: 'C', date: '2026-01-01', dateDisplay: 'January 1, 2026', tldr: 'tldr c', html: '<p>c</p>' },
  ]

  it('limits to the given number of entries, defaulting to 3', () => {
    expect(toIndexEntries(posts)).toHaveLength(3)
    expect(toIndexEntries(posts, 2)).toHaveLength(2)
  })

  it('strips html from the output shape', () => {
    const [entry] = toIndexEntries(posts, 1)
    expect(entry).toEqual({ slug: 'a', title: 'A', date: '2026-03-01', dateDisplay: 'March 1, 2026', tldr: 'tldr a' })
  })
})
