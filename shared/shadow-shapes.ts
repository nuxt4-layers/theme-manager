import { formatShadow, parseShadow, sameShadow, type ShadowContext, type ShadowLayer } from './css-value-parsers'

// Every shadow token exists per type, size, role and mode (--ui-shadow-md-accent-light),
// but in a theme the shape (offsets, blur, spread) is normally shared by all 14 roles
// and both modes; only the colour differs, and that comes from each role's `shadow`
// colour state. So the editor edits one shape per type and size and writes it to every
// role and mode. A copy whose shape differs is an exception: it is listed, never
// silently overwritten.

export const SHADOW_TYPES = [
  { id: 'shadow', label: 'Box', group: 'shadow', channel: 'fill', spread: true, maxLayers: 4 },
  { id: 'inset', label: 'Inset', group: 'insetShadow', channel: 'fill', spread: true, maxLayers: 4 },
  // filter: drop-shadow() takes a single shadow, so a runtime value must have one layer.
  { id: 'drop', label: 'Drop', group: 'dropShadow', channel: 'fill', spread: false, maxLayers: 1 },
  { id: 'text', label: 'Text', group: 'textShadow', channel: 'pen', spread: false, maxLayers: 4 },
] as const

export const SHADOW_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export const ELEVATION_ROLES = ['raised', 'lifted', 'overlay', 'modal'] as const
export const MODES = ['light', 'dark'] as const

export type ShadowType = (typeof SHADOW_TYPES)[number]
export type ShadowSize = (typeof SHADOW_SIZES)[number]
export type Mode = (typeof MODES)[number]
export type ShadowGroup = Record<string, string>

export interface ShapeCopy {
  key: string
  role: string
  mode: Mode
  context: ShadowContext
  layers: ShadowLayer[] | null
}

export interface ShadowShape {
  type: ShadowType
  size: ShadowSize
  /** The shape most copies share, or null when no copy can be read. */
  layers: ShadowLayer[] | null
  copies: ShapeCopy[]
  /** Copies with a different or unreadable shape. */
  exceptions: ShapeCopy[]
}

const KEY = /^(xs|sm|md|lg|xl)-([a-z]+)-(light|dark)$/

/** The per-role, per-mode copies of one type and size, in role then mode order. */
export function shapeCopies(group: ShadowGroup, type: ShadowType, size: ShadowSize): ShapeCopy[] {
  return Object.entries(group).flatMap(([key, value]) => {
    const match = key.match(KEY)
    if (!match || match[1] !== size) return []
    const context: ShadowContext = { channel: type.channel, role: match[2]!, mode: match[3] as Mode }
    return [{ key, role: context.role, mode: context.mode, context, layers: parseShadow(value, context, { spread: type.spread }) }]
  })
}

export function readShape(group: ShadowGroup, type: ShadowType, size: ShadowSize): ShadowShape {
  const copies = shapeCopies(group, type, size)
  const counts = new Map<string, { layers: ShadowLayer[]; count: number }>()
  for (const copy of copies) {
    if (!copy.layers) continue
    const signature = JSON.stringify(copy.layers)
    const entry = counts.get(signature) ?? { layers: copy.layers, count: 0 }
    entry.count++
    counts.set(signature, entry)
  }
  const shared = [...counts.values()].sort((left, right) => right.count - left.count)[0]?.layers ?? null
  return {
    type,
    size,
    layers: shared,
    copies,
    exceptions: copies.filter(copy => !copy.layers || !shared || !sameShadow(copy.layers, shared)),
  }
}

/**
 * The values to write when the shared shape changes: every copy that follows the shape,
 * each with its own role and mode colour. Exceptions are left out unless listed in
 * `include` (the editor's "reset to shared shape").
 */
export function writeShape(shape: ShadowShape, layers: readonly ShadowLayer[], include: readonly string[] = []): Record<string, string> {
  const exceptions = new Set(shape.exceptions.map(copy => copy.key))
  const values: Record<string, string> = {}
  for (const copy of shape.copies) {
    if (exceptions.has(copy.key) && !include.includes(copy.key)) continue
    values[copy.key] = formatShadow(layers, copy.context)
  }
  return values
}

/** Elevation roles and the default sizes are references; this reads which size each follows. */
export function referencedSize(value: string | undefined, prefix: string, mode: Mode): ShadowSize | null {
  const match = value?.match(new RegExp(`^var\\(--ui-${prefix}-(xs|sm|md|lg|xl)(?:-base)?-${mode}\\)$`))
  return (match?.[1] as ShadowSize | undefined) ?? null
}

export function elevationReference(size: ShadowSize, mode: Mode): string {
  return `var(--ui-shadow-${size}-${mode})`
}

/**
 * Sizes too close to tell apart: the largest layer's vertical offset and blur both within
 * 1px of the next size up. Only px lengths are compared.
 */
export function similarSteps(group: ShadowGroup, type: ShadowType): Array<[ShadowSize, ShadowSize]> {
  const largest = (size: ShadowSize) => {
    const layers = readShape(group, type, size).layers
    if (!layers) return null
    const layer = [...layers].sort((left, right) => right.blur.value - left.blur.value)[0]!
    return layer.y.unit === 'px' || layer.y.value === 0 ? layer.blur.unit === 'px' ? layer : null : null
  }
  const pairs: Array<[ShadowSize, ShadowSize]> = []
  for (let index = 0; index < SHADOW_SIZES.length - 1; index++) {
    const smaller = largest(SHADOW_SIZES[index]!)
    const larger = largest(SHADOW_SIZES[index + 1]!)
    if (smaller && larger && Math.abs(larger.y.value - smaller.y.value) <= 1 && Math.abs(larger.blur.value - smaller.blur.value) <= 1) {
      pairs.push([SHADOW_SIZES[index]!, SHADOW_SIZES[index + 1]!])
    }
  }
  return pairs
}
