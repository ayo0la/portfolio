// scripts/prefetch-github.js
// Runs at build time (via `npm run prebuild`).
// Fetches GitHub contribution data and writes src/data/github-activity.json.

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { GITHUB_QUERY, transformData } from './github-graphql.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/github-activity.json')

const token = process.env.GITHUB_TOKEN

if (!token) {
  console.warn('[prefetch-github] GITHUB_TOKEN not set — skipping prefetch, using existing JSON.')
  process.exit(0)
}

async function run() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: GITHUB_QUERY }),
  })

  if (!res.ok) {
    console.error(`[prefetch-github] GitHub API error: ${res.status} ${res.statusText}`)
    process.exit(1)
  }

  const raw = await res.json()

  if (raw.errors) {
    console.error('[prefetch-github] GraphQL errors:', JSON.stringify(raw.errors, null, 2))
    process.exit(1)
  }

  const data = transformData(raw)
  writeFileSync(OUT, JSON.stringify(data, null, 2))
  console.log(`[prefetch-github] Wrote ${OUT}`)
  console.log(`[prefetch-github] ${data.totalContributions} contributions, ${data.weeks.length} weeks`)
}

run().catch(err => {
  console.error('[prefetch-github]', err)
  process.exit(1)
})
