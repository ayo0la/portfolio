import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { buildPodcast } from '../scripts/build-podcast.js'

let root, contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'podcast-test-'))
  contentDir = join(root, 'content')
  outDir = join(root, 'public-podcast')
  audioDir = join(root, 'public-podcast-audio')
  styleSrc = join(root, 'podcast-style.css')
  styleOut = join(outDir, 'podcast.css')
  indexJsonOut = join(root, 'podcast-index.json')

  mkdirSync(contentDir, { recursive: true })
  mkdirSync(audioDir, { recursive: true })
  writeFileSync(join(contentDir, '2026-08-14-week-of-aug-11.md'), `---
title: "Week of Aug 11: shipping voice learning"
date: 2026-08-14
tldr: "N-rol voice learning shipped."
audio: "2026-08-14-week-of-aug-11.mp3"
---

## What shipped

Some text.
`)
  writeFileSync(join(contentDir, '2026-08-07-week-of-aug-4.md'), `---
title: "Week of Aug 4: no recording yet"
date: 2026-08-07
tldr: "Script written, not recorded yet."
audio: "2026-08-07-week-of-aug-4.mp3"
---

## Draft

Not recorded yet.
`)
  // Only the first episode's audio file exists — the second is a
  // drafted-but-not-yet-recorded episode, the normal in-progress state.
  writeFileSync(join(audioDir, '2026-08-14-week-of-aug-11.mp3'), 'fake mp3 bytes')
  writeFileSync(styleSrc, '.podcast-audio { width: 100%; }')
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('buildPodcast', () => {
  it('writes an episode page for each markdown file', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    const html = readFileSync(join(outDir, 'week-of-aug-11', 'index.html'), 'utf-8')
    expect(html).toContain('Week of Aug 11: shipping voice learning')
  })

  it('renders an audio player for an episode with a matching audio file', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    const html = readFileSync(join(outDir, 'week-of-aug-11', 'index.html'), 'utf-8')
    expect(html).toContain('src="/podcast/audio/2026-08-14-week-of-aug-11.mp3"')
  })

  it('renders a not-yet-published note for an episode with no matching audio file', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    const html = readFileSync(join(outDir, 'week-of-aug-4', 'index.html'), 'utf-8')
    expect(html).toContain('not yet published')
    expect(html).not.toContain('<audio')
  })

  it('writes a podcast index page listing every episode', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    const indexHtml = readFileSync(join(outDir, 'index.html'), 'utf-8')
    expect(indexHtml).toContain('href="/podcast/week-of-aug-11/"')
    expect(indexHtml).toContain('href="/podcast/week-of-aug-4/"')
  })

  it('copies the stylesheet into the output directory', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    expect(existsSync(styleOut)).toBe(true)
  })

  it('writes the trimmed JSON index including hasAudio for each episode', () => {
    buildPodcast({ contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut })
    const json = JSON.parse(readFileSync(indexJsonOut, 'utf-8'))
    expect(json).toHaveLength(2)
    const withAudio = json.find(e => e.slug === 'week-of-aug-11')
    const withoutAudio = json.find(e => e.slug === 'week-of-aug-4')
    expect(withAudio.hasAudio).toBe(true)
    expect(withoutAudio.hasAudio).toBe(false)
  })

  it('writes an empty JSON array when there are no episodes', () => {
    const emptyContentDir = join(root, 'empty-content')
    const emptyIndexJsonOut = join(root, 'empty-podcast-index.json')
    mkdirSync(emptyContentDir, { recursive: true })
    buildPodcast({ contentDir: emptyContentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut: emptyIndexJsonOut })
    const json = JSON.parse(readFileSync(emptyIndexJsonOut, 'utf-8'))
    expect(json).toEqual([])
  })

  it('does not throw and treats hasAudio as false when frontmatter omits the audio field entirely', () => {
    const noAudioFieldContentDir = join(root, 'no-audio-field-content')
    const noAudioFieldIndexJsonOut = join(root, 'no-audio-field-podcast-index.json')
    mkdirSync(noAudioFieldContentDir, { recursive: true })
    writeFileSync(join(noAudioFieldContentDir, '2026-08-21-week-of-aug-18.md'), `---
title: "Week of Aug 18: no audio field at all"
date: 2026-08-21
tldr: "Episode drafted, audio field never set."
---

## Draft

No audio field in frontmatter.
`)

    expect(() =>
      buildPodcast({
        contentDir: noAudioFieldContentDir,
        outDir,
        audioDir,
        styleSrc,
        styleOut,
        indexJsonOut: noAudioFieldIndexJsonOut,
      })
    ).not.toThrow()

    const html = readFileSync(join(outDir, 'week-of-aug-18', 'index.html'), 'utf-8')
    expect(html).toContain('not yet published')
    expect(html).not.toContain('<audio')

    const json = JSON.parse(readFileSync(noAudioFieldIndexJsonOut, 'utf-8'))
    const entry = json.find(e => e.slug === 'week-of-aug-18')
    expect(entry.hasAudio).toBe(false)
  })
})
