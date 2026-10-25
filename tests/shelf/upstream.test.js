import { describe, it, expect } from 'vitest'
import { summarizeUpstream, UPSTREAM_PRS } from '../../scripts/upstream.js'
import seed from '../../src/data/upstream.json'

describe('summarizeUpstream', () => {
  it('sums lines, counts merged only, and counts each repo stars once', () => {
    const prs = [
      { repo: 'a/x', additions: 10, deletions: 2, merged: true },
      { repo: 'a/x', additions: 5, deletions: 1, merged: true },
      { repo: 'b/y', additions: 100, deletions: 50, merged: true },
      { repo: 'b/y', additions: 999, deletions: 999, merged: false },
    ]
    const repos = { 'a/x': { stars: 1000 }, 'b/y': { stars: 200 } }
    expect(summarizeUpstream(prs, repos)).toEqual({
      merged: 3,
      additions: 115,
      deletions: 53,
      stars: 1200,
    })
  })

  it('exports the five merged PRs', () => {
    expect(UPSTREAM_PRS).toEqual([
      { owner: 'roboflow', repo: 'supervision', number: 2479 },
      { owner: 'roboflow', repo: 'supervision', number: 2558 },
      { owner: 'roboflow', repo: 'supervision', number: 2559 },
      { owner: 'roboflow', repo: 'rf-detr', number: 1325 },
      { owner: 'imageio', repo: 'imageio', number: 1208 },
    ])
  })

  it('ships the seed totals', () => {
    expect(seed).toEqual({ merged: 5, additions: 502, deletions: 212, stars: 62000 })
  })
})
