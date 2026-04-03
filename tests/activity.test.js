import { describe, it, expect, beforeEach } from 'vitest'
import { initActivity } from '../src/sections/activity.js'

const makeData = (overrides = {}) => ({
  totalContributions: 100,
  longestStreak: 7,
  publicRepos: 10,
  topLanguage: 'TypeScript',
  weeks: [
    { days: [
      { date: '2025-01-06', count: 0 },  // level 0
      { date: '2025-01-07', count: 3 },  // level 2 (2 < 3 <= 5)
      { date: '2025-01-08', count: 0 },  // level 0
      { date: '2025-01-09', count: 1 },  // level 1 (1 <= 2)
      { date: '2025-01-10', count: 0 },  // level 0
      { date: '2025-01-11', count: 0 },  // level 0
      { date: '2025-01-12', count: 10 }, // level 4 (> 9)
    ]},
  ],
  ...overrides,
})

beforeEach(() => {
  document.body.innerHTML = `
    <section id="activity">
      <div id="activity-stats" class="activity-stats"></div>
      <div id="activity-grid" class="activity-grid"></div>
      <div id="activity-months" class="activity-months"></div>
    </section>
  `
})

describe('initActivity', () => {
  it('renders all four stat values', () => {
    initActivity(makeData())
    const values = document.querySelectorAll('.activity-stat-value')
    const texts = Array.from(values).map(el => el.textContent)
    expect(texts).toContain('100')
    expect(texts).toContain('7 Days')
    expect(texts).toContain('10')
    expect(texts).toContain('TypeScript')
  })

  it('renders correct number of grid cells (7 days × weeks)', () => {
    initActivity(makeData())
    const cells = document.querySelectorAll('#activity-grid .activity-cell')
    expect(cells).toHaveLength(7) // 1 week × 7 days
  })

  it('assigns correct data-level to cells', () => {
    initActivity(makeData())
    const cells = document.querySelectorAll('#activity-grid .activity-cell')
    // count=0 → level 0, count=3 → level 2, count=1 → level 1, count=10 → level 4
    expect(cells[0].dataset.level).toBe('0')
    expect(cells[1].dataset.level).toBe('2')
    expect(cells[3].dataset.level).toBe('1')
    expect(cells[6].dataset.level).toBe('4')
  })

  it('does not throw when weeks is empty', () => {
    expect(() => initActivity(makeData({ weeks: [] }))).not.toThrow()
  })
})
