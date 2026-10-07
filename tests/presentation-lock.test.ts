import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

// The presentation pipeline is finalised. These files may only change by a deliberate,
// reviewed decision that updates this register in the same pull request.
// Line endings are normalised, so a CRLF checkout of an unchanged file still matches.
const LOCKED = {
  'assets/css/theme/theme-default.css': '1da883cde4efa715161e9cf4502d36c4cc923ed168d54f55392d03d154469a08',
  'assets/css/theme/theme-api.css': '2468fcbefd56e48ddf7dc5bee91d0614b3e546e80d962f64fcee56d264085ccb',
  'assets/css/tailwindcss/tailwind-config.css': '2ae980800dc5fd0449d764cb60084eff66dafe478b1d90571596c52ee6788b90',
}

const digest = (path: string) => createHash('sha256')
  .update(readFileSync(resolve(root, path), 'utf8').replace(/\r\n?/g, '\n'))
  .digest('hex')

describe('locked presentation CSS', () => {
  it.each(Object.entries(LOCKED))('keeps %s unchanged', (path, expected) => {
    expect(digest(path), `${path} is locked: theme-default.css, theme-api.css and tailwind-config.css are finalised`).toBe(expected)
  })
})
