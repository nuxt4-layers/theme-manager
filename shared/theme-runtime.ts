export const THEME_MODES = ['light', 'dark'] as const
export const THEME_INTERACTION_STATES = [
  'default',
  'hover',
  'active',
  'selected',
  'visited',
  'disabled',
] as const

export type RuntimeThemeMode = (typeof THEME_MODES)[number]
export type RuntimeInteractionState = (typeof THEME_INTERACTION_STATES)[number]
export type RuntimeThemeStates = Record<string, string>
export type RuntimeThemeModeDefinition = Record<string, RuntimeThemeStates>

export interface RuntimeThemePresentation {
  typography: Record<string, unknown>
  spacing: Record<string, unknown>
  radii: Record<string, unknown>
  effects: Record<string, unknown>
  responsive: Record<string, unknown>
  /** Optional so themes stored before border widths existed stay valid. */
  borders?: Record<string, unknown>
  /** Optional: easing curves, durations and animation shorthands. */
  motion?: Record<string, unknown>
}

export interface RuntimeTheme {
  id: string
  name: string
  modes: Record<RuntimeThemeMode, RuntimeThemeModeDefinition>
  presentation?: RuntimeThemePresentation
}

export interface ThemeStyleTarget {
  setProperty(name: string, value: string): void
  removeProperty(name: string): string
}

export interface ThemeApplication {
  readonly appliedVariables: readonly string[]
  clear(): void
  apply(theme: RuntimeTheme): void
}

const CSS_VARIABLE_PART = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i

export function assertRuntimeTheme(value: unknown): asserts value is RuntimeTheme {
  if (!value || typeof value !== 'object') {
    throw new TypeError('Theme must be an object.')
  }

  const theme = value as Partial<RuntimeTheme>
  if (typeof theme.id !== 'string' || !theme.id.trim()) {
    throw new TypeError('Theme id must be a non-empty string.')
  }
  if (typeof theme.name !== 'string' || !theme.name.trim()) {
    throw new TypeError('Theme name must be a non-empty string.')
  }
  if (!theme.modes || typeof theme.modes !== 'object') {
    throw new TypeError('Theme modes are required.')
  }

  for (const mode of THEME_MODES) {
    const definition = theme.modes[mode]
    if (!definition || typeof definition !== 'object') {
      throw new TypeError(`Theme mode '${mode}' is required.`)
    }

    for (const [role, states] of Object.entries(definition)) {
      if (!CSS_VARIABLE_PART.test(role) || !states || typeof states !== 'object') {
        throw new TypeError(`Invalid presentation role '${role}'.`)
      }

      for (const state of THEME_INTERACTION_STATES) {
        if (typeof states[state] !== 'string' || !states[state].trim()) {
          throw new TypeError(`Theme '${theme.id}' is missing ${mode} ${role} ${state}.`)
        }
      }

      for (const [state, cssValue] of Object.entries(states)) {
        if (!CSS_VARIABLE_PART.test(state) || typeof cssValue !== 'string' || !cssValue.trim()) {
          throw new TypeError(`Invalid presentation value at ${mode} ${role} ${state}.`)
        }
      }
    }
  }
}

export function runtimeVariableName(role: string, state: string, mode: RuntimeThemeMode): string {
  if (!CSS_VARIABLE_PART.test(role) || !CSS_VARIABLE_PART.test(state)) {
    throw new TypeError('Theme role and state names must be safe CSS variable segments.')
  }
  return `--ui-${role}-${state}-${mode}`
}

function presentationRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Theme presentation '${path}' must be an object.`)
  }
  return value as Record<string, unknown>
}

function presentationValues(value: unknown, path: string): Array<[string, string]> {
  return Object.entries(presentationRecord(value, path)).map(([key, cssValue]) => {
    if (!CSS_VARIABLE_PART.test(key) && key !== 'DEFAULT') throw new TypeError(`Invalid presentation key '${path}.${key}'.`)
    if (typeof cssValue !== 'string' || !cssValue.trim()) throw new TypeError(`Theme presentation '${path}.${key}' must be a non-empty CSS value.`)
    return [key, cssValue]
  })
}

export function runtimePresentationVariables(presentation: RuntimeThemePresentation): Array<[string, string]> {
  const typography = presentationRecord(presentation.typography, 'typography')
  const effects = presentationRecord(presentation.effects, 'effects')
  const responsive = presentationRecord(presentation.responsive, 'responsive')
  const entries: Array<[string, string]> = []
  // In groups whose bare name is a theme default (--ui-radius), DEFAULT writes that bare
  // name. Elsewhere it stays a suffix, so spacing.DEFAULT can never move --ui-spacing.
  const add = (prefix: string, value: unknown, path: string, bareDefault = false) => {
    for (const [key, cssValue] of presentationValues(value, path)) {
      entries.push([bareDefault && key === 'DEFAULT' ? `--ui-${prefix}` : `--ui-${prefix}-${key}`, cssValue])
    }
  }

  add('font', typography.families, 'typography.families')
  add('text', typography.sizes, 'typography.sizes')
  add('font-weight', typography.weights, 'typography.weights')
  add('spacing', presentation.spacing, 'spacing')
  add('radius', presentation.radii, 'radii', true)
  add('shadow', effects.shadow, 'effects.shadow')
  add('inset-shadow', effects.insetShadow, 'effects.insetShadow')
  add('drop-shadow', effects.dropShadow, 'effects.dropShadow')
  add('text-shadow', effects.textShadow, 'effects.textShadow')
  add('breakpoint', responsive.breakpoints, 'responsive.breakpoints')
  add('container', responsive.containers, 'responsive.containers')
  // Groups added after themes were first stored: each is optional, and an omitted
  // group keeps the bundled values from theme-default.css.
  const addOptional = (prefix: string, value: unknown, path: string) => {
    if (value !== undefined) add(prefix, value, path)
  }
  addOptional('tracking', typography.tracking, 'typography.tracking')
  addOptional('leading', typography.leading, 'typography.leading')
  addOptional('blur', effects.blur, 'effects.blur')
  addOptional('perspective', effects.perspective, 'effects.perspective')
  addOptional('tilt', effects.tilt, 'effects.tilt')
  addOptional('aspect', effects.aspect, 'effects.aspect')
  if (presentation.motion !== undefined) {
    const motion = presentationRecord(presentation.motion, 'motion')
    for (const key of Object.keys(motion)) {
      if (!(MOTION_KEYS as readonly string[]).includes(key)) throw new TypeError(`Invalid presentation key 'motion.${key}'.`)
    }
    addOptional('ease', motion.ease, 'motion.ease')
    addOptional('duration', motion.duration, 'motion.duration')
    addOptional('animate', motion.animate, 'motion.animate')
  }
  if (presentation.borders !== undefined) entries.push(...borderVariables(presentation.borders))
  return entries
}

const MOTION_KEYS = ['ease', 'duration', 'animate'] as const
const BORDER_KEYS = ['widths', 'focusRing', 'ring'] as const
const FOCUS_RING_KEYS = ['width', 'offset'] as const
const RING_KEYS = ['width'] as const

// Border, outline and ring widths; the widths DEFAULT writes the bare --ui-border-width.
function borderVariables(value: unknown): Array<[string, string]> {
  const borders = presentationRecord(value, 'borders')
  for (const key of Object.keys(borders)) {
    if (!(BORDER_KEYS as readonly string[]).includes(key)) throw new TypeError(`Invalid presentation key 'borders.${key}'.`)
  }
  const entries: Array<[string, string]> = []
  if (borders.widths !== undefined) {
    for (const [key, cssValue] of presentationValues(borders.widths, 'borders.widths')) {
      entries.push([key === 'DEFAULT' ? '--ui-border-width' : `--ui-border-width-${key}`, cssValue])
    }
  }
  const fixed = (group: 'focusRing' | 'ring', keys: readonly string[], prefix: string) => {
    if (borders[group] === undefined) return
    for (const [key, cssValue] of presentationValues(borders[group], `borders.${group}`)) {
      if (!keys.includes(key)) throw new TypeError(`Invalid presentation key 'borders.${group}.${key}'.`)
      entries.push([`--ui-${prefix}-${key}`, cssValue])
    }
  }
  fixed('focusRing', FOCUS_RING_KEYS, 'focus-ring')
  fixed('ring', RING_KEYS, 'ring')
  return entries
}

export function createThemeApplication(target: ThemeStyleTarget): ThemeApplication {
  let applied = new Set<string>()

  const clear = () => {
    for (const name of applied) target.removeProperty(name)
    applied = new Set()
  }

  return {
    get appliedVariables() {
      return [...applied]
    },
    clear,
    apply(theme) {
      assertRuntimeTheme(theme)
      clear()

      for (const mode of THEME_MODES) {
        for (const [role, states] of Object.entries(theme.modes[mode])) {
          for (const [state, cssValue] of Object.entries(states)) {
            const name = runtimeVariableName(role, state, mode)
            target.setProperty(name, cssValue)
            applied.add(name)
          }
        }
      }

      if (theme.presentation) {
        for (const [name, cssValue] of runtimePresentationVariables(theme.presentation)) {
          target.setProperty(name, cssValue)
          applied.add(name)
        }
      }
    },
  }
}

export function themeDefinitionToRuntime(value: unknown): RuntimeTheme {
  if (!value || typeof value !== 'object') throw new TypeError('Theme must be an object.')
  const definition = value as {
    id?: unknown
    name?: unknown
    modes?: unknown
    presentation?: unknown
  }
  const presentation = presentationRecord(definition.presentation, 'presentation')
  const runtime: RuntimeTheme = {
    id: String(definition.id ?? ''),
    name: String(definition.name ?? ''),
    modes: definition.modes as RuntimeTheme['modes'],
    presentation: presentation as unknown as RuntimeThemePresentation,
  }
  assertRuntimeTheme(runtime)
  runtimePresentationVariables(runtime.presentation!)
  return runtime
}

export function legacyColourThemeToRuntime(value: unknown): RuntimeTheme {
  if (!value || typeof value !== 'object') throw new TypeError('Theme must be an object.')
  const legacy = value as {
    id?: unknown
    name?: unknown
    colors?: { light?: unknown; dark?: unknown }
  }

  const runtime: RuntimeTheme = {
    id: String(legacy.id ?? ''),
    name: String(legacy.name ?? ''),
    modes: {
      light: legacy.colors?.light as RuntimeThemeModeDefinition,
      dark: legacy.colors?.dark as RuntimeThemeModeDefinition,
    },
  }
  assertRuntimeTheme(runtime)
  return runtime
}
