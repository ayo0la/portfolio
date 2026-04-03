import { describe, it, expect } from 'vitest'
import { transformData } from '../scripts/github-graphql.js'

const makeWeeks = (counts) => {
  // counts: flat array of 7-day chunks, e.g. [[0,1,0,2,0,0,3], ...]
  return counts.map((days, wi) => ({
    contributionDays: days.map((count, di) => ({
      contributionCount: count,
      date: `2025-01-${String(wi * 7 + di + 1).padStart(2, '0')}`,
    })),
  }))
}

describe('transformData', () => {
  it('returns totalContributions from the calendar', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 42,
              weeks: makeWeeks([[0, 1, 0, 0, 0, 0, 0]]),
            },
          },
          repositories: { totalCount: 5, nodes: [] },
        },
      },
    }
    const result = transformData(raw)
    expect(result.totalContributions).toBe(42)
  })

  it('calculates longest streak correctly', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 10,
              weeks: makeWeeks([
                [0, 1, 1, 1, 2, 2, 0],
                [2, 0, 0, 0, 0, 0, 0],
              ]),
            },
          },
          repositories: { totalCount: 0, nodes: [] },
        },
      },
    }
    const result = transformData(raw)
    expect(result.longestStreak).toBe(5) // indices 1-5: [1,1,1,2,2] = streak of 5
  })

  it('returns 0 streak when no contributions', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 0,
              weeks: makeWeeks([[0, 0, 0, 0, 0, 0, 0]]),
            },
          },
          repositories: { totalCount: 0, nodes: [] },
        },
      },
    }
    expect(transformData(raw).longestStreak).toBe(0)
  })

  it('returns publicRepos count', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: { totalContributions: 0, weeks: [] },
          },
          repositories: { totalCount: 17, nodes: [] },
        },
      },
    }
    expect(transformData(raw).publicRepos).toBe(17)
  })

  it('derives top language from repo nodes', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: { totalContributions: 0, weeks: [] },
          },
          repositories: {
            totalCount: 3,
            nodes: [
              { primaryLanguage: { name: 'TypeScript' } },
              { primaryLanguage: { name: 'TypeScript' } },
              { primaryLanguage: { name: 'Python' } },
            ],
          },
        },
      },
    }
    expect(transformData(raw).topLanguage).toBe('TypeScript')
  })

  it('returns N/A when no repos have a language', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: { totalContributions: 0, weeks: [] },
          },
          repositories: { totalCount: 0, nodes: [] },
        },
      },
    }
    expect(transformData(raw).topLanguage).toBe('N/A')
  })

  it('returns weeks array with days', () => {
    const raw = {
      data: {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: 1,
              weeks: makeWeeks([[0, 0, 1, 0, 0, 0, 0]]),
            },
          },
          repositories: { totalCount: 0, nodes: [] },
        },
      },
    }
    const result = transformData(raw)
    expect(result.weeks).toHaveLength(1)
    expect(result.weeks[0].days).toHaveLength(7)
    expect(result.weeks[0].days[2].count).toBe(1)
  })
})
