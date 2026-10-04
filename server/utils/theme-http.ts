import { createError, getHeader, readRawBody, type H3Event } from 'h3'
import { ThemeValidationError } from '../../shared/theme-definition'
import { ProtectedThemeError, ThemeConflictError, ThemeNotFoundError } from './theme-service'
import { ThemeAuthorizationError } from './theme-access'

const MAX_THEME_BODY_BYTES = 256 * 1024

export async function readThemeBody(event: H3Event): Promise<unknown> {
  const declaredLength = Number(getHeader(event, 'content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_THEME_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Theme request body exceeds the 256 KiB limit.' })
  }

  const raw = await readRawBody(event)
  if (raw === undefined || raw === null) throw new ThemeValidationError('Theme request body is required.')
  if (Buffer.byteLength(raw, 'utf8') > MAX_THEME_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Theme request body exceeds the 256 KiB limit.' })
  }

  try {
    return JSON.parse(raw)
  }
  catch {
    throw new ThemeValidationError('Theme request body must contain valid JSON.')
  }
}

export function themeHttpError(error: unknown): never {
  if (error && typeof error === 'object' && 'statusCode' in error) throw error
  if (error instanceof ThemeNotFoundError) throw createError({ statusCode: 404, statusMessage: 'Theme not found.' })
  if (error instanceof ThemeConflictError) throw createError({ statusCode: 409, statusMessage: error.message })
  if (error instanceof ThemeAuthorizationError) throw createError({ statusCode: 403, statusMessage: 'Theme operation is not authorized.' })
  if (error instanceof ProtectedThemeError) throw createError({ statusCode: 403, statusMessage: error.message })
  if (error instanceof ThemeValidationError) throw createError({ statusCode: 400, statusMessage: error.message })
  console.error('Unexpected Theme Manager server error.', error)
  throw createError({ statusCode: 500, statusMessage: 'Internal server error.' })
}
