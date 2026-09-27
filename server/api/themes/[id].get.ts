import { createError, getRouterParam } from 'h3'
import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Theme ID is required.' })
    const theme = await createThemeService(useThemeRepository()).find(id)
    if (!theme) throw createError({ statusCode: 404, statusMessage: 'Theme not found.' })
    return theme
  }
  catch (error) {
    themeHttpError(error)
  }
})
