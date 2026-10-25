import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderShelfHtml } from '../../scripts/shelf-markup.js'
import { PROJECTS } from '../../src/shelf/projects.js'
import { paintCovers2D } from '../../src/shelf/covers2d.js'
import { setNpmDownloads } from '../../src/sections/projects.js'

function stubCanvases() {
  const calls = []
  HTMLCanvasElement.prototype.getContext = function () {
    const ctx = new Proxy({}, {
      get: (t, k) => (k === 'canvas' ? this : typeof t[k] === 'undefined' ? (k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}) : t[k]),
      set: (t, k, v) => { t[k] = v; return true },
    })
    calls.push(this.dataset.cover)
    return ctx
  }
  return calls
}

const realGetContext = HTMLCanvasElement.prototype.getContext
afterEach(() => { HTMLCanvasElement.prototype.getContext = realGetContext })

beforeEach(() => {
  document.body.innerHTML = `<section id="projects">${renderShelfHtml(PROJECTS)}</section>`
})

describe('paintCovers2D', () => {
  it('paints every cover canvas once, then repaints npm when downloads arrive', () => {
    const calls = stubCanvases()
    paintCovers2D(document)
    expect(calls.sort()).toEqual(['npm', 'upstream'])
    setNpmDownloads({ '@ayo0la/cursor': 120 })
    expect(calls.filter((c) => c === 'npm').length).toBe(2)
    expect(calls.filter((c) => c === 'upstream').length).toBe(1)
  })
})
