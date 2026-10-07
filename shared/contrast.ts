// WCAG 2.2 contrast for theme colours (#rrggbb or #rrggbbaa), shared by the theme
// editor's live contrast badges and the presentation tests.

/** WCAG 1.4.3: text (Pen) against its Fill. */
export const TEXT_CONTRAST = 4.5
/** WCAG 1.4.3: large text, 24px or 18.66px bold. */
export const LARGE_TEXT_CONTRAST = 3
/** WCAG 1.4.11: Edges, focus rings and meaningful icons against adjacent colours. */
export const NON_TEXT_CONTRAST = 3

export interface ThemeColour {
  red: number
  green: number
  blue: number
  /** 0 (transparent) to 1 (opaque). */
  alpha: number
}

const HEX_COLOUR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i

/** Parses #rrggbb or #rrggbbaa; returns null for anything else (var(), names, functions). */
export function parseThemeColour(value: string): ThemeColour | null {
  const match = value.trim().match(HEX_COLOUR)
  if (!match) return null
  const [red, green, blue, alpha] = match.slice(1).map(part => (part === undefined ? 255 : Number.parseInt(part, 16)))
  return { red: red!, green: green!, blue: blue!, alpha: alpha! / 255 }
}

/** Paints a translucent colour over an opaque backdrop, as the browser does. */
export function composite(colour: ThemeColour, backdrop: ThemeColour): ThemeColour {
  const mix = (top: number, bottom: number) => Math.round((top * colour.alpha) + (bottom * (1 - colour.alpha)))
  return {
    red: mix(colour.red, backdrop.red),
    green: mix(colour.green, backdrop.green),
    blue: mix(colour.blue, backdrop.blue),
    alpha: 1,
  }
}

/** WCAG relative luminance of an opaque colour. */
export function relativeLuminance(colour: ThemeColour): number {
  const channel = (value: number) => {
    const scaled = value / 255
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  return (0.2126 * channel(colour.red)) + (0.7152 * channel(colour.green)) + (0.0722 * channel(colour.blue))
}

/**
 * Contrast ratio between two colours, from 1 to 21. A translucent foreground is first
 * painted over the background; a translucent background has no single answer, so it
 * returns null (the colour depends on what lies beneath it).
 */
export function contrastRatio(foreground: ThemeColour, background: ThemeColour): number | null {
  if (background.alpha !== 1) return null
  const painted = foreground.alpha === 1 ? foreground : composite(foreground, background)
  const first = relativeLuminance(painted)
  const second = relativeLuminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/** Contrast between two theme colour strings; null when either cannot be judged statically. */
export function themeContrast(foreground: string, background: string): number | null {
  const top = parseThemeColour(foreground)
  const bottom = parseThemeColour(background)
  return top && bottom ? contrastRatio(top, bottom) : null
}
