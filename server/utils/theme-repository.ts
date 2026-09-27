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

export function useThemeRepository(): ThemeRepository {
  if (!provider) {
    throw new Error('ThemeRepository provider has not been configured by the composition root.')
  }
  return provider.getThemeRepository()
}
