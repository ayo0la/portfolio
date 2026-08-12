// scripts/build-podcast.js
// Runs at build time (via `npm run prebuild`, or standalone via `npm run podcast`).
// Reads content/podcast/*.md, writes static pages into public/podcast/, and writes
// src/data/podcast-index.json for the in-page teaser section.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseEpisode, sortByDateDesc, toIndexEntries } from './podcast-transform.js'
import { renderEpisodeHtml, renderIndexHtml } from './podcast-templates.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  contentDir: resolve(__dirname, '../content/podcast'),
  outDir: resolve(__dirname, '../public/podcast'),
  audioDir: resolve(__dirname, '../public/podcast/audio'),
  styleSrc: resolve(__dirname, '../src/podcast-style.css'),
  styleOut: resolve(__dirname, '../public/podcast/podcast.css'),
  indexJsonOut: resolve(__dirname, '../src/data/podcast-index.json'),
}

export function buildPodcast(paths = {}) {
  const { contentDir, outDir, audioDir, styleSrc, styleOut, indexJsonOut } = { ...DEFAULTS, ...paths }

  const files = existsSync(contentDir)
    ? readdirSync(contentDir).filter(f => f.endsWith('.md'))
    : []

  const episodes = sortByDateDesc(
    files.map(filename => parseEpisode(filename, readFileSync(resolve(contentDir, filename), 'utf-8')))
  ).map(episode => ({
    ...episode,
    hasAudio: Boolean(episode.audio) && existsSync(resolve(audioDir, episode.audio)),
  }))

  mkdirSync(outDir, { recursive: true })
  mkdirSync(audioDir, { recursive: true })

  for (const episode of episodes) {
    const episodeDir = resolve(outDir, episode.slug)
    mkdirSync(episodeDir, { recursive: true })
    writeFileSync(resolve(episodeDir, 'index.html'), renderEpisodeHtml(episode))
  }

  writeFileSync(resolve(outDir, 'index.html'), renderIndexHtml(episodes))

  if (existsSync(styleSrc)) {
    copyFileSync(styleSrc, styleOut)
  }

  mkdirSync(dirname(indexJsonOut), { recursive: true })
  writeFileSync(indexJsonOut, JSON.stringify(toIndexEntries(episodes), null, 2))

  return episodes
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const episodes = buildPodcast()
  console.log(`[build-podcast] Wrote ${episodes.length} episode(s) to public/podcast/`)
}
