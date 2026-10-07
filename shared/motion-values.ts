// Reads motion and effect values into parts the theme editor shows as controls, and
// writes them back as the string the theme stores. As in css-value-parsers.ts, a value
// a parser cannot read returns null and the editor keeps a plain text field.

/** A duration in milliseconds ('150ms', '0.8s'). */
export function parseDuration(text: string): number | null {
  const match = text.trim().match(/^(\d*\.?\d+)(ms|s)$/)
  if (!match) return null
  return match[2] === 's' ? Math.round(Number(match[1]) * 1000 * 1000) / 1000 : Number(match[1])
}

export function formatDuration(ms: number): string {
  return `${ms}ms`
}

export type Bezier = [number, number, number, number]

export function parseBezier(text: string): Bezier | null {
  const match = text.trim().match(/^cubic-bezier\(\s*([^,()]+),\s*([^,()]+),\s*([^,()]+),\s*([^,()]+)\)$/)
  if (!match) return null
  const values = match.slice(1).map(Number) as Bezier
  if (values.some(value => !Number.isFinite(value))) return null
  // The x coordinates must lie in 0..1 or the curve is not a function of time.
  if (values[0] < 0 || values[0] > 1 || values[2] < 0 || values[2] > 1) return null
  return values
}

export function formatBezier(values: Bezier): string {
  return `cubic-bezier(${values.join(', ')})`
}

/**
 * An animation shorthand split into its keyframes name, timing and the rest
 * ('spin 0.8s linear infinite'). The keyframes are build-time, so only the duration
 * and easing are editable; both may be a var() reference to a motion token.
 */
export interface Animation {
  name: string
  duration: string
  easing: string
  rest: string
}

const TIME = /^(?:\d*\.?\d+m?s|var\(--ui-duration-[a-z0-9-]+\))$/
const EASING = /^(?:linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([^()]*\)|var\(--ui-ease-[a-z0-9-]+\))$/

export function parseAnimation(text: string): Animation | null {
  const parts = text.trim().match(/(?:[^\s(]+\([^()]*\)|[^\s]+)/g)
  if (!parts || parts.length < 3) return null
  const [name, duration, easing, ...rest] = parts as [string, string, string, ...string[]]
  if (!/^[a-z][a-z0-9-]*$/.test(name) || !TIME.test(duration) || !EASING.test(easing)) return null
  return { name, duration, easing, rest: rest.join(' ') }
}

export function formatAnimation(animation: Animation): string {
  return [animation.name, animation.duration, animation.easing, animation.rest].filter(Boolean).join(' ')
}

/** An aspect ratio ('16 / 9'). */
export function parseRatio(text: string): [number, number] | null {
  const match = text.trim().match(/^(\d*\.?\d+)\s*\/\s*(\d*\.?\d+)$/)
  if (!match) return null
  const ratio: [number, number] = [Number(match[1]), Number(match[2])]
  return ratio[0] > 0 && ratio[1] > 0 ? ratio : null
}

export function formatRatio([width, height]: [number, number]): string {
  return `${width} / ${height}`
}

/** An angle in degrees ('10deg'). */
export function parseAngle(text: string): number | null {
  const match = text.trim().match(/^(-?\d*\.?\d+)deg$/)
  return match ? Number(match[1]) : null
}

export function formatAngle(degrees: number): string {
  return `${degrees}deg`
}

/** The SVG path of an easing curve in a 100 × 100 box, y up; overshoot leaves the box. */
export function bezierPath([x1, y1, x2, y2]: Bezier): string {
  const point = (x: number, y: number) => `${x * 100} ${100 - y * 100}`
  return `M ${point(0, 0)} C ${point(x1, y1)}, ${point(x2, y2)}, ${point(1, 1)}`
}
