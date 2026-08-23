import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')

function ossCard() {
  const start = html.indexOf('id="oss-card"')
  const end = html.indexOf('npm-collapse-hint', start)
  return html.slice(start, end)
}

describe('open source card', () => {
  it('lists the merged rf-detr PR #1325', () => {
    expect(ossCard()).toContain('https://github.com/roboflow/rf-detr/pull/1325')
  })

  it('marks both Roboflow PRs as merged', () => {
    const card = ossCard()
    for (const name of ['roboflow/supervision · PR #2479', 'roboflow/rf-detr · PR #1325']) {
      const start = card.indexOf(name)
      expect(start, `${name} row present`).toBeGreaterThan(-1)
      const row = card.slice(start, card.indexOf('</a>', start))
      expect(row).toMatch(/merged/i)
    }
  })

  it('shows the rf-detr star count', () => {
    expect(ossCard()).toContain('9k ★')
  })

  it('summarizes the combined star count as 65,000+', () => {
    expect(ossCard()).toContain('65,000+ combined stars')
  })
})
