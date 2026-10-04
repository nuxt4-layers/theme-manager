import { createThemeService } from '../../utils/theme-service'
import { readThemeBody, themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'
import { useThemeAccessIntegration } from '../../utils/theme-access'

export default defineEventHandler(async (event) => {
  try {
    const theme = await createThemeService(useThemeRepository(), useThemeAccessIntegration()).create(await readThemeBody(event))
    return { success: true, id: theme.id }
  }
  catch (error) {
    themeHttpError(error)
  }
})
