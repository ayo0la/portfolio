// scripts/build-shelf.js
// Bakes the Other Work shelf into index.html from src/shelf/projects.js.
// Runs in `npm run prebuild`; needs no network or tokens.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { injectShelf } from './shelf-markup.js'
import { PROJECTS } from '../src/shelf/projects.js'

const HOME = resolve(dirname(fileURLToPath(import.meta.url)), '../index.html')

export function buildShelf(homeHtml = HOME) {
  const before = readFileSync(homeHtml, 'utf-8')
  const after = injectShelf(before, PROJECTS)
  if (after !== before) writeFileSync(homeHtml, after)
  return after !== before
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(buildShelf() ? 'shelf: index.html updated' : 'shelf: index.html already current')
}
