import type { ThemeDefinition } from '../contracts'
import { createCanonicalThemeDefinition } from './canonical-theme'

// Describes every token a Theme Definition can carry, for the theme editor: where it
// lives in the definition, the --ui-* variable the runtime engine writes for it, which
// editor section shows it and which control edits it. Derived from the canonical theme,
// so it always covers the full vocabulary; tests keep it equal to what the engine writes.

export type ThemeTokenSection =
  | 'colours'
  | 'shadows'
  | 'spacing'
  | 'radii'
  | 'typography'
  | 'borders'
  | 'motion'
  | 'effects'
  | 'breakpoints'

export type ThemeTokenKind =
  | 'colour' // #rrggbb or #rrggbbaa
  | 'reference' // exactly var(--ui-*): follows another token
  | 'length' // px, rem, em, %
  | 'number' // unitless (line heights)
  | 'font-family'
  | 'font-feature'
  | 'font-weight'
  | 'shadow' // one or more box-shadow / drop-shadow / text-shadow layers
  | 'easing' // cubic-bezier() or a keyword
  | 'duration'
  | 'animation' // animation shorthand: keyframes, duration, easing, iteration
  | 'ratio' // aspect ratio, e.g. 16 / 9
  | 'angle'

export interface ThemeToken {
  /** Path inside the Theme Definition, e.g. ['presentation', 'radii', 'card']. */
  path: readonly string[]
  /** The --ui-* variable the runtime engine writes for this token. */
  variable: string
  section: ThemeTokenSection
  /** Sub-group within the section, e.g. 'shadow', 'insetShadow', 'tracking'. */
  group: string
  kind: ThemeTokenKind
  /** False when changing the value cannot affect rendering (breakpoints are compiled). */
  editable: boolean
  /** For kind 'reference': the variable it follows. */
  references?: string
  mode?: 'light' | 'dark'
  role?: string
  state?: string
}

interface PresentationGroup {
  path: readonly string[]
  prefix: string
  section: ThemeTokenSection
  kind: ThemeTokenKind
  /** The key that writes the bare prefix (--ui-radius) instead of --ui-<prefix>-<key>. */
  bareKey?: string
  editable?: boolean
}

// Mirrors runtimePresentationVariables in theme-runtime.ts; the catalogue tests prove
// the two produce exactly the same variable names.
const PRESENTATION_GROUPS: readonly PresentationGroup[] = [
  { path: ['typography', 'families'], prefix: 'font', section: 'typography', kind: 'font-family' },
  { path: ['typography', 'sizes'], prefix: 'text', section: 'typography', kind: 'length' },
  { path: ['typography', 'weights'], prefix: 'font-weight', section: 'typography', kind: 'font-weight' },
  { path: ['typography', 'tracking'], prefix: 'tracking', section: 'typography', kind: 'length' },
  { path: ['typography', 'leading'], prefix: 'leading', section: 'typography', kind: 'number' },
  { path: ['spacing'], prefix: 'spacing', section: 'spacing', kind: 'length' },
  { path: ['radii'], prefix: 'radius', section: 'radii', kind: 'length', bareKey: 'DEFAULT' },
  { path: ['effects', 'shadow'], prefix: 'shadow', section: 'shadows', kind: 'shadow' },
  { path: ['effects', 'insetShadow'], prefix: 'inset-shadow', section: 'shadows', kind: 'shadow' },
  { path: ['effects', 'dropShadow'], prefix: 'drop-shadow', section: 'shadows', kind: 'shadow' },
  { path: ['effects', 'textShadow'], prefix: 'text-shadow', section: 'shadows', kind: 'shadow' },
  { path: ['effects', 'blur'], prefix: 'blur', section: 'effects', kind: 'length' },
  { path: ['effects', 'perspective'], prefix: 'perspective', section: 'effects', kind: 'length' },
  { path: ['effects', 'tilt'], prefix: 'tilt', section: 'effects', kind: 'angle' },
  { path: ['effects', 'aspect'], prefix: 'aspect', section: 'effects', kind: 'ratio' },
  { path: ['responsive', 'breakpoints'], prefix: 'breakpoint', section: 'breakpoints', kind: 'length', editable: false },
  { path: ['responsive', 'containers'], prefix: 'container', section: 'spacing', kind: 'length' },
  { path: ['borders', 'widths'], prefix: 'border-width', section: 'borders', kind: 'length', bareKey: 'DEFAULT' },
  { path: ['borders', 'focusRing'], prefix: 'focus-ring', section: 'borders', kind: 'length' },
  { path: ['borders', 'ring'], prefix: 'ring', section: 'borders', kind: 'length' },
  { path: ['motion', 'ease'], prefix: 'ease', section: 'motion', kind: 'easing' },
  { path: ['motion', 'duration'], prefix: 'duration', section: 'motion', kind: 'duration' },
  { path: ['motion', 'animate'], prefix: 'animate', section: 'motion', kind: 'animation' },
]

const REFERENCE = /^var\((--ui-[a-z0-9-]+)\)$/
const MODE_SUFFIX = /-(light|dark)$/

function kindOf(group: PresentationGroup, key: string, value: string): ThemeTokenKind {
  if (REFERENCE.test(value.trim())) return 'reference'
  if (group.prefix === 'font' && key.endsWith('-feature-settings')) return 'font-feature'
  // Line heights are either lengths (1.5rem) or unitless multipliers (1.1).
  if (group.prefix === 'text' && key.endsWith('-line-height')) return /^\d*\.?\d+$/.test(value.trim()) ? 'number' : 'length'
  return group.kind
}

function at(record: unknown, path: readonly string[]): Record<string, unknown> | undefined {
  let current = record
  for (const part of path) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current && typeof current === 'object' ? current as Record<string, unknown> : undefined
}

/** Every token of a theme, colours first (by mode, then role, then state). */
export function createThemeTokenCatalogue(theme: ThemeDefinition = createCanonicalThemeDefinition()): ThemeToken[] {
  const tokens: ThemeToken[] = []

  for (const [mode, roles] of Object.entries(theme.modes) as Array<['light' | 'dark', Record<string, Record<string, string>>]>) {
    for (const [role, states] of Object.entries(roles)) {
      for (const state of Object.keys(states)) {
        tokens.push({
          path: ['modes', mode, role, state],
          variable: `--ui-${role}-${state}-${mode}`,
          section: 'colours',
          group: role.slice(0, role.indexOf('-')),
          kind: 'colour',
          editable: true,
          mode,
          role: role.slice(role.indexOf('-') + 1),
          state,
        })
      }
    }
  }

  for (const group of PRESENTATION_GROUPS) {
    const values = at(theme.presentation, group.path)
    if (!values) continue
    for (const [key, value] of Object.entries(values)) {
      const kind = kindOf(group, key, String(value))
      const reference = String(value).trim().match(REFERENCE)?.[1]
      const mode = group.section === 'shadows' ? key.match(MODE_SUFFIX)?.[1] as 'light' | 'dark' | undefined : undefined
      tokens.push({
        path: ['presentation', ...group.path, key],
        variable: key === group.bareKey ? `--ui-${group.prefix}` : `--ui-${group.prefix}-${key}`,
        section: group.section,
        group: group.path[group.path.length - 1]!,
        kind,
        editable: group.editable ?? true,
        ...(reference ? { references: reference } : {}),
        ...(mode ? { mode } : {}),
      })
    }
  }

  return tokens
}

/** The catalogue of the canonical (complete) vocabulary. */
export const THEME_TOKEN_CATALOGUE: readonly ThemeToken[] = createThemeTokenCatalogue()

/** Reads a token's current value from a theme. */
export function themeTokenValue(theme: ThemeDefinition, token: ThemeToken): string | undefined {
  const parent = at(theme, token.path.slice(0, -1))
  const value = parent?.[token.path[token.path.length - 1]!]
  return typeof value === 'string' ? value : undefined
}
