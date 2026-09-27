export type ThemeLibraryScope =
  | { kind: 'mine' }
  | { kind: 'group'; groupId: string }
  | { kind: 'organisation'; organisationId: string }
  | { kind: 'public' }
  | { kind: 'system' }

export function themeLibraryPath(scope: ThemeLibraryScope): string {
  const query = new URLSearchParams()
  query.set('scope', scope.kind)
  if (scope.kind === 'group') query.set('groupId', scope.groupId)
  if (scope.kind === 'organisation') query.set('organisationId', scope.organisationId)
  return `/api/themes?${query}`
}
