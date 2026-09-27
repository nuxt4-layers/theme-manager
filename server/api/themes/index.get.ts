import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'
import { useThemeAccessIntegration } from '../../utils/theme-access'

export default defineEventHandler(async () => {
  try {
    return await createThemeService(useThemeRepository(), useThemeAccessIntegration()).list()
  }
  catch (error) {
    themeHttpError(error)
  }
})
