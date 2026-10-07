import { describe, expect, it } from 'vitest'
import { createCanonicalThemeDefinition } from '../shared/canonical-theme'
import { COLOUR_STATES, ROLE_GROUPS, roleContrast, rolesOf, type ColourModes } from '../shared/colour-pairs'

const modes = () => structuredClone(createCanonicalThemeDefinition().modes) as unknown as ColourModes

describe('colour pair contrast', () => {
  it('lists the fourteen roles in guide order', () => {
    expect(rolesOf(modes(), 'light')).toEqual(ROLE_GROUPS.flatMap(group => [...group.roles]))
  })

  it('passes every judged pair of the default palette, in both modes', () => {
    const failures: string[] = []
    for (const mode of ['light', 'dark'] as const) {
      for (const role of rolesOf(modes(), mode)) {
        for (const { state, pen, edge } of roleContrast(modes(), mode, role)) {
          for (const [channel, result] of [['pen', pen], ['edge', edge]] as const) {
            if (result.status === 'fail') failures.push(`${mode} ${role} ${state} ${channel}: ${result.ratio.toFixed(2)}`)
            if (result.status === 'unchecked' && state !== 'shadow') failures.push(`${mode} ${role} ${state} ${channel}: ${result.reason}`)
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('judges every state, exempting disabled and leaving shadow unjudged', () => {
    const results = roleContrast(modes(), 'light', 'accent')
    expect(results.map(result => result.state)).toEqual([...COLOUR_STATES])
    expect(results.find(result => result.state === 'disabled')!.pen.status).toBe('exempt')
    expect(results.find(result => result.state === 'shadow')!.edge.status).toBe('unchecked')
  })

  it('reports a failing pair with its ratio and the level it needed', () => {
    const broken = modes()
    broken.light!['pen-accent']!.hover = broken.light!['fill-accent']!.hover! // pen the same as its fill
    expect(roleContrast(broken, 'light', 'accent').find(result => result.state === 'hover')!.pen)
      .toMatchObject({ status: 'fail', required: 4.5, ratio: 1 })
  })

  it('judges the focus ring against the weakest page layer, not its own fill', () => {
    const broken = modes()
    broken.light!['edge-base']!.focus = '#edf0f4ff' // the floor layer's own fill
    const focus = roleContrast(broken, 'light', 'base').find(result => result.state === 'focus')!.edge
    expect(focus).toMatchObject({ status: 'fail', against: 'floor layer' })
    expect('ratio' in focus && focus.ratio).toBeCloseTo(1, 5)
  })

  it('leaves a value it cannot read unjudged instead of guessing', () => {
    const custom = modes()
    custom.light!['pen-accent']!.default = 'var(--brand-ink)'
    expect(roleContrast(custom, 'light', 'accent')[0]!.pen.status).toBe('unchecked')
  })
})
