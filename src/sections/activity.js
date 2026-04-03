// src/sections/activity.js

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Map a contribution count to a 0–4 intensity level.
 * @param {number} count
 * @returns {0|1|2|3|4}
 */
function countToLevel(count) {
  if (count === 0) return 0
  if (count <= 2)  return 1
  if (count <= 5)  return 2
  if (count <= 9)  return 3
  return 4
}

/**
 * Render the activity section from data.
 * @param {{ totalContributions: number, longestStreak: number, publicRepos: number, topLanguage: string, weeks: Array }} data
 */
export function initActivity(data) {
  renderStats(data)
  renderGrid(data.weeks)
  renderMonths(data.weeks)
}

function renderStats(data) {
  const el = document.getElementById('activity-stats')
  if (!el) return

  const stats = [
    { label: 'Contributions', value: data.totalContributions },
    { label: 'Longest Streak', value: data.longestStreak ? `${data.longestStreak} Days` : '0 Days' },
    { label: 'Repos',          value: data.publicRepos },
    { label: 'Top Language',   value: data.topLanguage },
  ]

  el.innerHTML = stats.map(s => `
    <div class="activity-stat-item">
      <span class="activity-stat-label">${s.label}</span>
      <span class="activity-stat-value">${s.value}</span>
    </div>
  `).join('')
}

function renderGrid(weeks) {
  const el = document.getElementById('activity-grid')
  if (!el) return

  el.innerHTML = weeks.map(week =>
    week.days.map(day => {
      const level = countToLevel(day.count)
      return `<span class="activity-cell" data-level="${level}" title="${day.date}: ${day.count}"></span>`
    }).join('')
  ).join('')
}

function renderMonths(weeks) {
  const el = document.getElementById('activity-months')
  if (!el || weeks.length === 0) return

  // Show a month label at the first week of each new month
  const labels = []
  let lastMonth = -1

  weeks.forEach((week, i) => {
    const firstDay = week.days[0]
    if (!firstDay) return
    const month = new Date(firstDay.date).getMonth()
    if (month !== lastMonth) {
      labels.push(MONTH_LABELS[month])
      lastMonth = month
    }
  })

  el.innerHTML = labels.map(label =>
    `<span class="activity-month-label">${label}</span>`
  ).join('')
}
