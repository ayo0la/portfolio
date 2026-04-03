// scripts/github-graphql.js

export const GITHUB_QUERY = `
  query {
    user(login: "ayo0la") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 100, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
        totalCount
        nodes {
          primaryLanguage { name }
        }
      }
    }
  }
`

/**
 * @param {object} raw  Raw GitHub GraphQL JSON response
 * @returns {{ totalContributions: number, longestStreak: number, publicRepos: number, topLanguage: string, weeks: Array }}
 */
export function transformData(raw) {
  const user = raw.data.user
  const calendar = user.contributionsCollection.contributionCalendar
  const repoNodes = user.repositories.nodes

  return {
    totalContributions: calendar.totalContributions,
    longestStreak: calcLongestStreak(calendar.weeks),
    publicRepos: user.repositories.totalCount,
    topLanguage: calcTopLanguage(repoNodes),
    weeks: calendar.weeks.map(w => ({
      days: w.contributionDays.map(d => ({
        date: d.date,
        count: d.contributionCount,
      })),
    })),
  }
}

function calcLongestStreak(weeks) {
  const days = weeks.flatMap(w => w.contributionDays)
  let max = 0
  let cur = 0
  for (const day of days) {
    if (day.contributionCount > 0) {
      cur++
      if (cur > max) max = cur
    } else {
      cur = 0
    }
  }
  return max
}

function calcTopLanguage(nodes) {
  const counts = {}
  for (const repo of nodes) {
    const lang = repo.primaryLanguage?.name
    if (lang) counts[lang] = (counts[lang] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'N/A'
}
