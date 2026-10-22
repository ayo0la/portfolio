import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')

function ossCard() {
  const start = html.indexOf('id="oss-card"')
  const end = html.indexOf('GITHUB →', start)
  return html.slice(start, end)
}

const MERGED = [
  ['supervision #2479', 'https://github.com/roboflow/supervision/pull/2479'],
  ['supervision #2558', 'https://github.com/roboflow/supervision/pull/2558'],
  ['supervision #2559', 'https://github.com/roboflow/supervision/pull/2559'],
  ['rf-detr #1325', 'https://github.com/roboflow/rf-detr/pull/1325'],
  ['imageio #1208', 'https://github.com/imageio/imageio/pull/1208'],
]

describe('open source card', () => {
  it('lists every merged upstream PR, each marked merged', () => {
    const card = ossCard()
    for (const [name, url] of MERGED) {
      expect(card, `${name} link present`).toContain(url)
      const start = card.indexOf(name)
      expect(start, `${name} row present`).toBeGreaterThan(-1)
      const row = card.slice(start, card.indexOf('</a>', start))
      expect(row).toMatch(/merged/i)
    }
  })

  it('does not list PRs that are still open', () => {
    expect(ossCard()).not.toContain('hiring-agent')
  })

  it('shows the merged count on the cover', () => {
    expect(ossCard()).toContain('5× MERGED')
  })

  it('summarizes the combined star count of the merged repos', () => {
    const card = ossCard()
    expect(card).toContain('62,000+ combined stars')
    expect(card).toContain('62K')
  })
})
