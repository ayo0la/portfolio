// Upstream contribution totals. Pure helpers only; network fetching lives in prefetch-github.js.

export const UPSTREAM_PRS = [
  { owner: 'roboflow', repo: 'supervision', number: 2479 },
  { owner: 'roboflow', repo: 'supervision', number: 2558 },
  { owner: 'roboflow', repo: 'supervision', number: 2559 },
  { owner: 'roboflow', repo: 'rf-detr', number: 1325 },
  { owner: 'imageio', repo: 'imageio', number: 1208 },
]

// prs: [{ repo: 'owner/name', additions, deletions, merged, repoStars? }]
// repos: { 'owner/name': { stars } } (takes precedence over repoStars)
export function summarizeUpstream(prs, repos = {}) {
  const merged = prs.filter((p) => p.merged)
  const starsByRepo = new Map()
  for (const p of merged) {
    if (starsByRepo.has(p.repo)) continue
    starsByRepo.set(p.repo, repos?.[p.repo]?.stars ?? p.repoStars ?? 0)
  }
  return {
    merged: merged.length,
    additions: merged.reduce((n, p) => n + p.additions, 0),
    deletions: merged.reduce((n, p) => n + p.deletions, 0),
    stars: [...starsByRepo.values()].reduce((n, s) => n + s, 0),
  }
}
