import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let contactLinks

beforeAll(() => {
  const html = readFileSync(join(root, 'index.html'), 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  contactLinks = Object.fromEntries(
    [...doc.querySelectorAll('#contact .contact-links a')].map(link => [
      link.textContent.trim(),
      link.getAttribute('href'),
    ]),
  )
})

describe('contact links', () => {
  it('uses Ayoola’s current public profiles and contact email', () => {
    expect(contactLinks).toEqual({
      EMAIL: 'mailto:aymorakinyo1@gmail.com',
      LINKEDIN: 'https://linkedin.com/in/ayoolamorakinyo',
      GITHUB: 'https://github.com/ayo0la',
      X: 'https://x.com/AYO0LA',
    })
  })
})
