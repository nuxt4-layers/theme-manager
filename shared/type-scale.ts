// The type scale: sizes, each with its own line height, and roles (body, label,
// caption, heading, title) that follow a size and its line height together. A role is
// stored as two references, --ui-text-body: var(--ui-text-base) and
// --ui-text-body-line-height: var(--ui-text-base-line-height); they always move as a pair.

export type TypeSizes = Record<string, string>

const LINE_HEIGHT = '-line-height'
const SIZE_REFERENCE = /^var\(--ui-text-([a-z0-9]+)\)$/

/** Sizes in scale order (concrete values with a line height partner). */
export function typeSizes(sizes: TypeSizes): string[] {
  return Object.keys(sizes).filter(key => !key.endsWith(LINE_HEIGHT) && !SIZE_REFERENCE.test(sizes[key]!.trim()))
}

/** Roles: keys whose value follows a size. */
export function typeRoles(sizes: TypeSizes): string[] {
  return Object.keys(sizes).filter(key => !key.endsWith(LINE_HEIGHT) && SIZE_REFERENCE.test(sizes[key]!.trim()))
}

/** The size a role follows, or null when it holds its own value. */
export function roleSize(sizes: TypeSizes, role: string): string | null {
  return sizes[role]?.trim().match(SIZE_REFERENCE)?.[1] ?? null
}

/** The two values that make a role follow a size. */
export function roleValues(role: string, size: string): Record<string, string> {
  return {
    [role]: `var(--ui-text-${size})`,
    [`${role}${LINE_HEIGHT}`]: `var(--ui-text-${size}${LINE_HEIGHT})`,
  }
}

/** True when a line height is a unitless multiplier (1.1) rather than a length. */
export function isUnitless(value: string): boolean {
  return /^\d*\.?\d+$/.test(value.trim())
}
