import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { buildBlog } from '../scripts/build-blog.js'

let root, contentDir, outDir, styleSrc, styleOut, indexJsonOut

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'blog-test-'))
  contentDir = join(root, 'content')
  outDir = join(root, 'public-blog')
  styleSrc = join(root, 'blog-style.css')
  styleOut = join(outDir, 'blog.css')
  indexJsonOut = join(root, 'blog-index.json')

  mkdirSync(contentDir, { recursive: true })
  writeFileSync(join(contentDir, '2026-06-20-fgvm-first-results.md'), `---
title: "First results from FGVM"
date: 2026-06-20
tldr: "Early numbers."
---

## What I tried

Some text.
`)
  writeFileSync(styleSrc, 'body { color: red; }')
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('buildBlog', () => {
  it('writes a post page for each markdown file', () => {
    buildBlog({ contentDir, outDir, styleSrc, styleOut, indexJsonOut })
    const postHtml = readFileSync(join(outDir, 'fgvm-first-results', 'index.html'), 'utf-8')
    expect(postHtml).toContain('First results from FGVM')
  })

  it('writes a blog index page listing the post', () => {
    buildBlog({ contentDir, outDir, styleSrc, styleOut, indexJsonOut })
    const indexHtml = readFileSync(join(outDir, 'index.html'), 'utf-8')
    expect(indexHtml).toContain('href="/blog/fgvm-first-results/"')
  })

  it('copies the stylesheet into the output directory', () => {
    buildBlog({ contentDir, outDir, styleSrc, styleOut, indexJsonOut })
    expect(existsSync(styleOut)).toBe(true)
  })

  it('writes the trimmed JSON index for the teaser section', () => {
    buildBlog({ contentDir, outDir, styleSrc, styleOut, indexJsonOut })
    const json = JSON.parse(readFileSync(indexJsonOut, 'utf-8'))
    expect(json).toHaveLength(1)
    expect(json[0].slug).toBe('fgvm-first-results')
  })

  it('writes an empty JSON array when there are no posts', () => {
    const emptyContentDir = join(root, 'empty-content')
    const emptyIndexJsonOut = join(root, 'empty-blog-index.json')
    mkdirSync(emptyContentDir, { recursive: true })
    buildBlog({ contentDir: emptyContentDir, outDir, styleSrc, styleOut, indexJsonOut: emptyIndexJsonOut })
    const json = JSON.parse(readFileSync(emptyIndexJsonOut, 'utf-8'))
    expect(json).toEqual([])
  })
})
