import type { ThemeToken } from './theme-token-catalogue'

// Helpers for editing scales whose entries may follow one another: a radius role
// (--ui-radius-card: var(--ui-radius-lg)) chooses among the radius sizes. A reference
// into a different scale (a screen width following a breakpoint) is shown, not chosen.

export interface ReferenceOption {
  label: string
  value: string
}

/** The --api-* name a mode-independent --ui-* token reaches components under. */
export function apiName(variable: string): string {
  return variable.replace(/^--ui-/, '--api-')
}

/** The last path segment, which names a token within its group (md, card, DEFAULT). */
export function tokenKey(token: ThemeToken): string {
  return token.path[token.path.length - 1]!
}

/**
 * The sizes a reference may follow: the concrete (non-reference) tokens of its own group.
 * Returns null when the token follows a token outside its group; that link is shown,
 * not edited.
 */
export function referenceOptions(token: ThemeToken, group: readonly ThemeToken[]): ReferenceOption[] | null {
  if (token.kind !== 'reference' || !token.references) return null
  const sizes = group.filter(candidate => candidate.kind !== 'reference')
  if (!sizes.some(candidate => candidate.variable === token.references)) return null
  return sizes.map(size => ({ label: tokenKey(size), value: `var(${size.variable})` }))
}
