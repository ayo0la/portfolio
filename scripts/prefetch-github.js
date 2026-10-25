// scripts/prefetch-github.js
// Runs at build time (via `npm run prebuild`).
// Fetches GitHub contribution data and writes src/data/github-activity.json.

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { GITHUB_QUERY, transformData } from './github-graphql.js'
import { UPSTREAM_PRS, summarizeUpstream } from './upstream.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/github-activity.json')
const UPSTREAM_OUT = resolve(__dirname, '../src/data/upstream.json')

const token = process.env.GITHUB_TOKEN
const TIMEOUT_MS = 10000

if (!token) {
  console.warn('[prefetch-github] GITHUB_TOKEN not set - skipping prefetch, using existing JSON.')
  process.exit(0)
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`)
  return res.json()
}

// Never throws: on any failure the existing upstream.json is kept.
async function fetchUpstream() {
  try {
    const prs = []
    const repos = {}
    for (const { owner, repo, number } of UPSTREAM_PRS) {
      const full = `${owner}/${repo}`
      const pr = await ghGet(`/repos/${full}/pulls/${number}`)
      prs.push({
        repo: full,
        additions: pr.additions,
        deletions: pr.deletions,
        merged: pr.merged === true,
      })
      if (!repos[full]) {
        const info = await ghGet(`/repos/${full}`)
        repos[full] = { stars: info.stargazers_count }
      }
    }
    const summary = summarizeUpstream(prs, repos)
    writeFileSync(UPSTREAM_OUT, JSON.stringify(summary, null, 2) + '\n')
    console.log(`[prefetch-github] Wrote ${UPSTREAM_OUT}`, summary)
  } catch (err) {
    console.warn('[prefetch-github] upstream fetch failed, keeping existing upstream.json:', err.message)
  }
}

async function run() {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: GITHUB_QUERY }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
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

  await fetchUpstream()
}

run().catch(err => {
  // a timeout or network failure must never break the build: keep the committed JSON
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError' || err?.cause?.code) {
    console.warn('[prefetch-github] request failed, keeping existing JSON:', err.message)
    process.exit(0)
  }
  console.error('[prefetch-github]', err)
  process.exit(1)
})
