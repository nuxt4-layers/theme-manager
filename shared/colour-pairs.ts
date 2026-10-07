import { NON_TEXT_CONTRAST, TEXT_CONTRAST, themeContrast } from './contrast'

// The contrast rules of the colour palette, judged per role, state and mode, for the
// editor's live badges. They mirror the palette tests: Pen on its own Fill at 4.5:1,
// Edge on its own Fill at 3:1, and the focus ring (drawn outside the control, with an
// offset) against every page layer it can sit on at 3:1. Disabled is exempt; shadow
// colours are translucent tints and are not judged.

export const COLOUR_STATES = [
  'default', 'hover', 'focus', 'pressed', 'active', 'selected', 'on', 'visited', 'disabled', 'error', 'loading', 'shadow',
] as const

export const PAGE_LAYERS = ['floor', 'base', 'primary', 'secondary', 'tertiary'] as const

export const ROLE_GROUPS = [
  { id: 'layers', label: 'Layers', roles: ['floor', 'base', 'primary', 'secondary', 'tertiary'] },
  { id: 'purpose', label: 'Purpose', roles: ['accent', 'muted', 'input', 'link'] },
  { id: 'status', label: 'Status', roles: ['success', 'info', 'warning', 'error', 'notification'] },
] as const

export type ColourMode = 'light' | 'dark'
export type ColourModes = Record<string, Record<string, Record<string, string>>>

export type ContrastVerdict =
  | { status: 'pass' | 'fail', ratio: number, required: number, against: string }
  | { status: 'exempt' | 'unchecked', reason: string }

export interface StateContrast {
  state: string
  pen: ContrastVerdict
  edge: ContrastVerdict
}

function verdict(foreground: string | undefined, background: string | undefined, required: number, against: string): ContrastVerdict {
  if (!foreground || !background) return { status: 'unchecked', reason: 'missing colour' }
  const ratio = themeContrast(foreground, background)
  if (ratio === null) return { status: 'unchecked', reason: 'translucent or not a hex colour' }
  return { status: ratio >= required ? 'pass' : 'fail', ratio, required, against }
}

/** The lowest focus-ring contrast against the page layers, which is the one that matters. */
function focusVerdict(modes: ColourModes, mode: ColourMode, edge: string | undefined): ContrastVerdict {
  let worst: ContrastVerdict | null = null
  for (const layer of PAGE_LAYERS) {
    const result = verdict(edge, modes[mode]?.[`fill-${layer}`]?.default, NON_TEXT_CONTRAST, `${layer} layer`)
    if (result.status === 'unchecked') return result
    if (!worst || ('ratio' in worst && 'ratio' in result && result.ratio < worst.ratio)) worst = result
  }
  return worst ?? { status: 'unchecked', reason: 'no page layers' }
}

/** Contrast verdicts for every state of one role in one mode. */
export function roleContrast(modes: ColourModes, mode: ColourMode, role: string): StateContrast[] {
  const colours = (channel: string) => modes[mode]?.[`${channel}-${role}`] ?? {}
  const fill = colours('fill')
  const pen = colours('pen')
  const edge = colours('edge')

  return COLOUR_STATES.map((state) => {
    if (state === 'shadow') {
      const reason = 'shadow colours are translucent tints'
      return { state, pen: { status: 'unchecked', reason }, edge: { status: 'unchecked', reason } }
    }
    if (state === 'disabled') {
      const reason = 'disabled is exempt (WCAG 1.4.3)'
      return { state, pen: { status: 'exempt', reason }, edge: { status: 'exempt', reason } }
    }
    return {
      state,
      pen: verdict(pen[state], fill[state], TEXT_CONTRAST, `${role} ${state} fill`),
      edge: state === 'focus'
        ? focusVerdict(modes, mode, edge[state])
        : verdict(edge[state], fill[state], NON_TEXT_CONTRAST, `${role} ${state} fill`),
    }
  })
}

/** The roles present in a mode, in guide order, followed by any custom roles. */
export function rolesOf(modes: ColourModes, mode: ColourMode): string[] {
  const present = new Set(Object.keys(modes[mode] ?? {}).map(key => key.slice(key.indexOf('-') + 1)))
  const known: string[] = ROLE_GROUPS.flatMap(group => [...group.roles])
  return [...known.filter(role => present.has(role)), ...[...present].filter(role => !known.includes(role)).sort()]
}
