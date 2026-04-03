// api/github.js
// Vercel serverless function. Returns live GitHub activity data as JSON.
// Cached for 1 hour via CDN, stale-while-revalidate for another hour.

import { GITHUB_QUERY, transformData } from '../scripts/github-graphql.js'

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN

  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured' })
  }

  const ghRes = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: GITHUB_QUERY }),
  })

  if (!ghRes.ok) {
    return res.status(502).json({ error: `GitHub API error: ${ghRes.status}` })
  }

  const raw = await ghRes.json()

  if (raw.errors) {
    return res.status(502).json({ error: 'GraphQL error', details: raw.errors })
  }

  const data = transformData(raw)

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=3600')
  return res.status(200).json(data)
}
