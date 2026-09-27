import { createError, getRouterParam, readBody } from 'h3'
import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Theme ID is required.' })
    const theme = await createThemeService(useThemeRepository()).update(id, await readBody(event))
    return { success: true, id: theme.id }
  }
  catch (error) {
    themeHttpError(error)
  }
})
