import { createError, getRouterParam } from 'h3'
import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Theme ID is required.' })
    await createThemeService(useThemeRepository()).delete(id)
    return { success: true, id }
  }
  catch (error) {
    themeHttpError(error)
  }
})
