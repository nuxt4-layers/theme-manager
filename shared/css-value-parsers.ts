// Reads compound CSS values into structured parts the theme editor can show as
// controls, and writes them back as the exact string the theme stores. Anything a
// parser cannot read returns null, so the editor falls back to a plain text field
// instead of rewriting a value it does not understand.

export interface Length {
  value: number
  /** '' only for a bare 0. */
  unit: '' | 'px' | 'rem' | 'em'
}

/** A shadow layer's colour: the token's own role shadow colour, or a fixed colour. */
export type ShadowColour = { kind: 'role' } | { kind: 'literal'; value: string }

export interface ShadowLayer {
  inset: boolean
  x: Length
  y: Length
  blur: Length
  /** Box and inset shadows only; drop and text shadows have no spread. */
  spread: Length | null
  colour: ShadowColour
}

/** Which role shadow colour a layer's 'role' colour stands for. */
export interface ShadowContext {
  channel: 'fill' | 'pen'
  role: string
  mode: 'light' | 'dark'
}

const LENGTH = /^(-?\d*\.?\d+)(px|rem|em)?$/
const LITERAL_COLOUR = /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch|oklab)\([^()]*\)|transparent|currentcolor)$/i

export function parseLength(text: string): Length | null {
  const match = text.match(LENGTH)
  if (!match) return null
  const value = Number(match[1])
  const unit = (match[2] ?? '') as Length['unit']
  // A unitless length is only valid as 0.
  if (!unit && value !== 0) return null
  return { value, unit }
}

export function formatLength(length: Length): string {
  return `${length.value}${length.value === 0 && !length.unit ? '' : length.unit}`
}

export function roleShadowColour(context: ShadowContext): string {
  return `var(--ui-${context.channel}-${context.role}-shadow-${context.mode})`
}

/** Splits on top-level commas, leaving commas inside rgb(...) or var(...) alone. */
function splitLayers(value: string): string[] {
  const layers: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < value.length; index++) {
    const character = value[index]
    if (character === '(') depth++
    else if (character === ')') depth--
    else if (character === ',' && depth === 0) {
      layers.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  layers.push(value.slice(start).trim())
  return layers
}

/** Splits a layer on top-level spaces, keeping var(...) and rgb(...) whole. */
function splitParts(layer: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const character of layer) {
    if (character === '(') depth++
    if (character === ')') depth--
    if (/\s/.test(character) && depth === 0) {
      if (current) parts.push(current)
      current = ''
    }
    else current += character
  }
  if (current) parts.push(current)
  return parts
}

/**
 * Reads a shadow into layers. `context` names the token's own role shadow colour, which
 * reads back as { kind: 'role' }; any other colour stays a literal. Returns null for a
 * value it cannot read (a reference, keywords, a missing colour).
 */
export function parseShadow(value: string, context: ShadowContext, options: { spread: boolean }): ShadowLayer[] | null {
  const roleColour = roleShadowColour(context)
  const layers: ShadowLayer[] = []
  for (const layer of splitLayers(value.trim())) {
    const parts = splitParts(layer)
    const inset = parts[0] === 'inset'
    if (inset) parts.shift()
    const colourText = parts.pop()
    if (!colourText) return null
    const colour: ShadowColour | null = colourText === roleColour
      ? { kind: 'role' }
      : LITERAL_COLOUR.test(colourText) ? { kind: 'literal', value: colourText } : null
    if (!colour) return null

    const lengths = parts.map(parseLength)
    if (lengths.some(length => length === null)) return null
    const expected = options.spread ? [3, 4] : [3]
    if (!expected.includes(lengths.length)) return null
    const [x, y, blur, spread] = lengths as Length[]
    if (blur!.value < 0) return null
    layers.push({ inset, x: x!, y: y!, blur: blur!, spread: options.spread ? spread ?? null : null, colour })
  }
  return layers.length ? layers : null
}

/** Writes layers back as a shadow value, resolving a 'role' colour from `context`. */
export function formatShadow(layers: readonly ShadowLayer[], context: ShadowContext): string {
  return layers.map((layer) => {
    const parts = [layer.x, layer.y, layer.blur, ...(layer.spread ? [layer.spread] : [])].map(formatLength)
    const colour = layer.colour.kind === 'role' ? roleShadowColour(context) : layer.colour.value
    return [...(layer.inset ? ['inset'] : []), ...parts, colour].join(' ')
  }).join(', ')
}

/** True when two layer lists describe the same shape (colours compared as written). */
export function sameShadow(first: readonly ShadowLayer[], second: readonly ShadowLayer[]): boolean {
  return JSON.stringify(first) === JSON.stringify(second)
}
