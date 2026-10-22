import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initNpmSection, NPM_PACKAGES } from '../src/sections/npm.js'

beforeEach(() => {
  document.body.innerHTML = '<div id="activity-npm"></div>'
})

describe('initNpmSection', () => {
  it('renders a row for each package', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    await initNpmSection()
    const rows = document.querySelectorAll('.activity-npm-row')
    expect(rows.length).toBe(NPM_PACKAGES.length)
    expect(rows[0].getAttribute('data-npm-pkg')).toBe('@ayo0la/grain-canvas')
  })

  it('fills in weekly downloads when npm answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ downloads: 1234 }) })))
    await initNpmSection()
    expect(document.querySelector('.activity-npm-downloads').textContent).toBe('1,234')
  })

  it('does nothing without the container', async () => {
    document.body.innerHTML = ''
    await expect(initNpmSection()).resolves.toBeUndefined()
  })
})
