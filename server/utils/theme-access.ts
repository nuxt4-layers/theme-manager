import type {
  ThemeAction,
  ThemeActorContext,
  ThemeActorContextProvider,
  ThemeAuthorizationService,
  ThemeDefinition,
  ThemeResourceRef,
} from '../../contracts'

export class ThemeAuthorizationError extends Error {
  constructor(public readonly action: ThemeAction, public readonly resourceId: string) {
    super(`Action '${action}' is not authorized for Theme '${resourceId}'.`)
  }
}

export interface ThemeAccessIntegration {
  actor(): Promise<ThemeActorContext>
  assert(action: ThemeAction, resource: ThemeResourceRef): Promise<ThemeActorContext>
}

let actorProvider: ThemeActorContextProvider | null = null
let authorizationService: ThemeAuthorizationService | null = null

export function provideThemeActorContext(provider: ThemeActorContextProvider): void {
  actorProvider = provider
}

export function provideThemeAuthorization(service: ThemeAuthorizationService): void {
  authorizationService = service
}

export function clearThemeAccessIntegration(): void {
  actorProvider = null
  authorizationService = null
}

export function useThemeAccessIntegration(): ThemeAccessIntegration {
  if (!actorProvider || !authorizationService) {
    throw new Error('Theme Identity/Authorization integration has not been configured by the composition root.')
  }

  return {
    actor: () => actorProvider!.getActorContext(),
    async assert(action, resource) {
      const actor = await actorProvider!.getActorContext()
      if (!await authorizationService!.isAllowed({ actor, action, resource })) {
        throw new ThemeAuthorizationError(action, resource.resourceId)
      }
      return actor
    },
  }
}

export function themeResource(theme: Pick<ThemeDefinition, 'id' | 'ownership' | 'visibility'>): ThemeResourceRef {
  return { resourceType: 'theme', resourceId: theme.id, ownership: theme.ownership, visibility: theme.visibility }
}
