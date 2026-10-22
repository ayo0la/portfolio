// scripts/build-blog.js
// Runs at build time (via `npm run prebuild`, or standalone via `npm run blog`).
// Reads content/blog/*.md, writes static pages into public/blog/, and writes
// src/data/blog-index.json for the in-page teaser section.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parsePost, sortByDateDesc, toIndexEntries } from './blog-transform.js'
import { renderPostHtml, renderIndexHtml } from './blog-templates.js'
import { renderRss, renderSitemap, injectHomeBlogCards } from './site-feeds.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  contentDir: resolve(__dirname, '../content/blog'),
  outDir: resolve(__dirname, '../public/blog'),
  styleSrc: resolve(__dirname, '../src/blog-style.css'),
  styleOut: resolve(__dirname, '../public/blog/blog.css'),
  indexJsonOut: resolve(__dirname, '../src/data/blog-index.json'),
  siteDir: resolve(__dirname, '../public'),
  homeHtml: resolve(__dirname, '../index.html'),
}

export function buildBlog(paths = {}) {
  const { contentDir, outDir, styleSrc, styleOut, indexJsonOut, siteDir, homeHtml } = { ...DEFAULTS, ...paths }

  const files = existsSync(contentDir)
    ? readdirSync(contentDir).filter(f => f.endsWith('.md'))
    : []

  const posts = sortByDateDesc(
    files.map(filename => parsePost(filename, readFileSync(resolve(contentDir, filename), 'utf-8')))
  )

  mkdirSync(outDir, { recursive: true })

  for (const post of posts) {
    const postDir = resolve(outDir, post.slug)
    mkdirSync(postDir, { recursive: true })
    writeFileSync(resolve(postDir, 'index.html'), renderPostHtml(post))
  }

  writeFileSync(resolve(outDir, 'index.html'), renderIndexHtml(posts))

  if (existsSync(styleSrc)) {
    copyFileSync(styleSrc, styleOut)
  }

  mkdirSync(dirname(indexJsonOut), { recursive: true })
  writeFileSync(indexJsonOut, JSON.stringify(toIndexEntries(posts), null, 2))

  // Site-wide files only when the caller targets real paths (tests pass temp
  // dirs for these, or leave them out to keep the real site untouched).
  if (!paths.contentDir || paths.siteDir) {
    writeFileSync(resolve(siteDir, 'rss.xml'), renderRss(posts))
    writeFileSync(resolve(siteDir, 'sitemap.xml'), renderSitemap(posts))
  }
  if ((!paths.contentDir || paths.homeHtml) && existsSync(homeHtml)) {
    writeFileSync(homeHtml, injectHomeBlogCards(readFileSync(homeHtml, 'utf-8'), toIndexEntries(posts)))
  }

  return posts
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const posts = buildBlog()
  console.log(`[build-blog] Wrote ${posts.length} post(s) to public/blog/`)
}
