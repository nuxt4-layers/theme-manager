import { createError, getRouterParam } from 'h3'
import { createThemeService } from '../../utils/theme-service'
import { readThemeBody, themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'
import { useThemeAccessIntegration } from '../../utils/theme-access'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Theme ID is required.' })
    const theme = await createThemeService(useThemeRepository(), useThemeAccessIntegration()).update(id, await readThemeBody(event))
    return { success: true, id: theme.id }
  }
  catch (error) {
    themeHttpError(error)
  }
})
