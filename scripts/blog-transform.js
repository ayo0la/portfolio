// scripts/blog-transform.js
import matter from 'gray-matter'
import { marked } from 'marked'

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/

export function parsePost(filename, raw) {
  const { data, content } = matter(raw)
  const slug = filename.replace(/\.md$/, '').replace(DATE_PREFIX, '')
  const date = new Date(data.date)
  const dateDisplay = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return {
    slug,
    title: data.title,
    date: date.toISOString().slice(0, 10),
    dateDisplay,
    tldr: data.tldr,
    html: marked.parse(content),
  }
}

export function sortByDateDesc(posts) {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

export function toIndexEntries(posts, limit = 3) {
  return posts.slice(0, limit).map(({ slug, title, date, dateDisplay, tldr }) => ({
    slug, title, date, dateDisplay, tldr,
  }))
}
