import type { ThemeRepository } from '../../contracts'

export interface ThemeRepositoryProvider {
  getThemeRepository(): ThemeRepository
}

let provider: ThemeRepositoryProvider | null = null

export function provideThemeRepository(next: ThemeRepositoryProvider): void {
  provider = next
}

export function clearThemeRepositoryProvider(): void {
  provider = null
}

/** Raised when Theme storage is used but the host composed no repository (HTTP 503). */
export class ThemeStorageUnavailableError extends Error {
  constructor() {
    super('ThemeRepository provider has not been configured by the composition root.')
  }
}

/**
 * Whether the host composed Theme storage. Without it Theme Manager runs stand-alone:
 * the built-in default Theme applies and nothing can be created, edited or saved.
 */
export function hasThemeRepository(): boolean {
  return provider !== null
}

export function useThemeRepository(): ThemeRepository {
  if (!provider) throw new ThemeStorageUnavailableError()
  return provider.getThemeRepository()
}
