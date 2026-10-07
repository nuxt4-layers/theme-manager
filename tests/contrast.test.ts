import { describe, expect, it } from 'vitest'
import { NON_TEXT_CONTRAST, TEXT_CONTRAST, composite, contrastRatio, parseThemeColour, themeContrast } from '../shared/contrast'

describe('contrast', () => {
  it('parses #rrggbb and #rrggbbaa, and nothing else', () => {
    expect(parseThemeColour('#0668a4')).toEqual({ red: 6, green: 104, blue: 164, alpha: 1 })
    expect(parseThemeColour('#04598e47')).toMatchObject({ red: 4, green: 89, blue: 142 })
    expect(parseThemeColour('#04598e47')!.alpha).toBeCloseTo(0x47 / 255)
    for (const value of ['var(--ui-fill-base-default-light)', 'red', '#fff', 'rgb(0 0 0)']) expect(parseThemeColour(value)).toBeNull()
  })

  it('matches the WCAG reference ratios', () => {
    expect(themeContrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(themeContrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(themeContrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
    expect(themeContrast('#ffffff', '#767676')).toBeCloseTo(themeContrast('#767676', '#ffffff')!, 10)
  })

  it('judges the default accent pairs the palette tests rely on', () => {
    expect(themeContrast('#ffffffff', '#0668a4ff')!).toBeGreaterThanOrEqual(TEXT_CONTRAST)
    expect(themeContrast('#83c5fcff', '#0668a4ff')!).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
  })

  it('paints a translucent foreground over an opaque background', () => {
    const half = parseThemeColour('#00000080')!
    expect(composite(half, parseThemeColour('#ffffff')!)).toEqual({ red: 127, green: 127, blue: 127, alpha: 1 })
    expect(contrastRatio(half, parseThemeColour('#ffffff')!)).toBeCloseTo(themeContrast('#7f7f7f', '#ffffff')!, 10)
  })

  it('refuses to judge a translucent background or an unparsed colour', () => {
    expect(themeContrast('#000000', '#ffffff80')).toBeNull()
    expect(themeContrast('var(--x)', '#ffffff')).toBeNull()
  })
})
