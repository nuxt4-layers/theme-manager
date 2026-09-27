import { createError } from 'h3'
import { ProtectedThemeError, ThemeConflictError, ThemeNotFoundError } from './theme-service'
import { ThemeAuthorizationError } from './theme-access'

export function themeHttpError(error: unknown): never {
  if (error instanceof ThemeNotFoundError) throw createError({ statusCode: 404, statusMessage: error.message })
  if (error instanceof ThemeConflictError) throw createError({ statusCode: 409, statusMessage: error.message })
  if (error instanceof ThemeAuthorizationError) throw createError({ statusCode: 403, statusMessage: error.message })
  if (error instanceof ProtectedThemeError) throw createError({ statusCode: 403, statusMessage: error.message })
  if (error instanceof TypeError) throw createError({ statusCode: 400, statusMessage: error.message })
  throw error
}
