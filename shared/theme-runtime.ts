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

export interface RuntimeTheme {
  id: string
  name: string
  modes: Record<RuntimeThemeMode, RuntimeThemeModeDefinition>
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
    },
  }
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
