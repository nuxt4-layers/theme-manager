import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import { formatLength, formatShadow, parseLength, parseShadow, type ShadowContext } from '../shared/css-value-parsers'
import { SHADOW_SIZES, SHADOW_TYPES, readShape, referencedSize, similarSteps, writeShape, type ShadowGroup } from '../shared/shadow-shapes'

const effects = () => structuredClone(createCanonicalThemeDefinition().presentation.effects) as Record<string, ShadowGroup>
const accentLight: ShadowContext = { channel: 'fill', role: 'accent', mode: 'light' }

describe('shadow parser', () => {
  it('reads and writes back every per-role shadow in the theme exactly', () => {
    let checked = 0
    for (const type of SHADOW_TYPES) {
      for (const [key, value] of Object.entries(effects()[type.group]!)) {
        const match = key.match(/^(?:xs|sm|md|lg|xl)-([a-z]+)-(light|dark)$/)
        if (!match) continue
        const context: ShadowContext = { channel: type.channel, role: match[1]!, mode: match[2] as 'light' | 'dark' }
        const layers = parseShadow(value, context, { spread: type.spread })
        expect(layers, `${type.group}.${key}`).not.toBeNull()
        expect(layers!.every(layer => layer.colour.kind === 'role')).toBe(true)
        expect(formatShadow(layers!, context)).toBe(value)
        checked++
      }
    }
    expect(checked).toBe(560)
  })

  it('reads two-layer box shadows with spread and the inset keyword', () => {
    expect(parseShadow('0 2px 5px -1px var(--ui-fill-accent-shadow-light), 0 1px 2px -1px #00000033', accentLight, { spread: true })).toEqual([
      { inset: false, x: { value: 0, unit: '' }, y: { value: 2, unit: 'px' }, blur: { value: 5, unit: 'px' }, spread: { value: -1, unit: 'px' }, colour: { kind: 'role' } },
      { inset: false, x: { value: 0, unit: '' }, y: { value: 1, unit: 'px' }, blur: { value: 2, unit: 'px' }, spread: { value: -1, unit: 'px' }, colour: { kind: 'literal', value: '#00000033' } },
    ])
    expect(parseShadow('inset 0 2px 4px 0 var(--ui-fill-accent-shadow-light)', accentLight, { spread: true })![0]!.inset).toBe(true)
  })

  it('keeps commas inside colour functions within their layer', () => {
    expect(parseShadow('0 1px 2px rgb(0, 0, 0, 0.2)', accentLight, { spread: false })).toHaveLength(1)
  })

  it('refuses what it cannot read, so the editor never rewrites it', () => {
    for (const value of ['var(--ui-shadow-sm-base-light)', 'none', '0 2px var(--x)', '0 2px 4px', '1 2px 3px #000', '0 2px -3px #000']) {
      expect(parseShadow(value, accentLight, { spread: true }), value).toBeNull()
    }
    expect(parseShadow('0 2px 3px 1px #000', accentLight, { spread: false })).toBeNull()
  })

  it('reads lengths, allowing a bare unit only for 0', () => {
    expect(parseLength('-1.5rem')).toEqual({ value: -1.5, unit: 'rem' })
    expect(parseLength('0')).toEqual({ value: 0, unit: '' })
    expect(parseLength('4')).toBeNull()
    expect(formatLength({ value: 0, unit: 'px' })).toBe('0px')
  })
})

describe('shadow shapes', () => {
  it('finds one shared shape per type and size in the default theme, with no exceptions', () => {
    for (const type of SHADOW_TYPES) {
      for (const size of SHADOW_SIZES) {
        const shape = readShape(effects()[type.group]!, type, size)
        expect(shape.copies, `${type.id} ${size}`).toHaveLength(28)
        expect(shape.layers).not.toBeNull()
        expect(shape.exceptions).toEqual([])
      }
    }
  })

  it('writes an edited shape to every role and mode, each with its own colour', () => {
    const box = SHADOW_TYPES[0]
    const shape = readShape(effects().shadow!, box, 'sm')
    const layers = structuredClone(shape.layers!)
    layers[0]!.blur = { value: 9, unit: 'px' }
    const values = writeShape(shape, layers)
    expect(Object.keys(values)).toHaveLength(28)
    expect(values['sm-accent-dark']).toBe('0 2px 9px -1px var(--ui-fill-accent-shadow-dark), 0 1px 2px -1px var(--ui-fill-accent-shadow-dark)')
    expect(values['sm-base-light']).toContain('var(--ui-fill-base-shadow-light)')
  })

  it('lists a copy with its own shape as an exception and leaves it alone unless reset', () => {
    const group = effects().shadow!
    group['md-accent-dark'] = '0 0 24px 4px var(--ui-fill-accent-shadow-dark)'
    const shape = readShape(group, SHADOW_TYPES[0], 'md')
    expect(shape.exceptions.map(copy => copy.key)).toEqual(['md-accent-dark'])
    expect(writeShape(shape, shape.layers!)).not.toHaveProperty('md-accent-dark')
    expect(writeShape(shape, shape.layers!, ['md-accent-dark'])['md-accent-dark']).toContain('var(--ui-fill-accent-shadow-dark)')
  })

  it('uses pen shadow colours for text shadows', () => {
    const text = SHADOW_TYPES[3]
    const shape = readShape(effects().textShadow!, text, 'sm')
    expect(writeShape(shape, shape.layers!)['sm-info-light']).toContain('var(--ui-pen-info-shadow-light)')
  })

  it('reads which size an elevation role or default follows', () => {
    const shadow = effects().shadow!
    expect(referencedSize(shadow['raised-light'], 'shadow', 'light')).toBe('sm')
    expect(referencedSize(shadow['modal-dark'], 'shadow', 'dark')).toBe('xl')
    expect(referencedSize(shadow['md-light'], 'shadow', 'light')).toBe('md')
    expect(referencedSize('0 1px 2px #000', 'shadow', 'light')).toBeNull()
  })

  it('flags neighbouring sizes too close to tell apart', () => {
    expect(similarSteps(effects().shadow!, SHADOW_TYPES[0])).toEqual([])
    const group = effects().shadow!
    for (const key of Object.keys(group).filter(key => key.startsWith('md-'))) {
      group[key] = group[key.replace(/^md-/, 'sm-')]!
    }
    expect(similarSteps(group, SHADOW_TYPES[0])).toEqual([['sm', 'md']])
  })
})
