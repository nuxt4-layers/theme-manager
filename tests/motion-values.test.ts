import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import {
  bezierPath, formatAnimation, formatAngle, formatBezier, formatDuration, formatRatio,
  parseAnimation, parseAngle, parseBezier, parseDuration, parseRatio,
} from '../shared/motion-values'

const presentation = createCanonicalThemeDefinition().presentation as Record<string, Record<string, Record<string, string>>>

describe('motion and effect values', () => {
  it('reads durations in ms or s and writes ms', () => {
    expect(parseDuration('150ms')).toBe(150)
    expect(parseDuration('0.8s')).toBe(800)
    expect(parseDuration('var(--ui-duration-slow)')).toBeNull()
    expect(formatDuration(75)).toBe('75ms')
  })

  it('reads cubic-bezier curves and rejects x outside 0 to 1', () => {
    expect(parseBezier('cubic-bezier(0.34, 1.56, 0.64, 1)')).toEqual([0.34, 1.56, 0.64, 1])
    expect(parseBezier('cubic-bezier(1.2, 0, 0, 1)')).toBeNull()
    expect(parseBezier('var(--ui-ease-out)')).toBeNull()
    expect(formatBezier([0.2, 0, 0, 1])).toBe('cubic-bezier(0.2, 0, 0, 1)')
    expect(bezierPath([0, 0, 1, 1])).toBe('M 0 100 C 0 100, 100 0, 100 0')
  })

  it('splits every canonical animation and writes it back unchanged', () => {
    for (const [key, value] of Object.entries(presentation.motion!.animate!)) {
      const animation = parseAnimation(value)
      expect(animation, key).not.toBeNull()
      expect(formatAnimation(animation!)).toBe(value)
    }
    expect(parseAnimation('spin 0.8s linear infinite')).toEqual({ name: 'spin', duration: '0.8s', easing: 'linear', rest: 'infinite' })
    expect(parseAnimation('spin')).toBeNull()
  })

  it('round-trips every canonical duration, easing, tilt and ratio it can read', () => {
    for (const value of Object.values(presentation.motion!.duration!)) expect(formatDuration(parseDuration(value)!)).toBe(value)
    for (const value of Object.values(presentation.motion!.ease!)) {
      const curve = parseBezier(value)
      if (curve) expect(formatBezier(curve)).toBe(value)
    }
    for (const value of Object.values(presentation.effects!.tilt!)) expect(formatAngle(parseAngle(value)!)).toBe(value)
    for (const value of Object.values(presentation.effects!.aspect!)) expect(formatRatio(parseRatio(value)!)).toBe(value)
    expect(parseRatio('0 / 1')).toBeNull()
  })
})
