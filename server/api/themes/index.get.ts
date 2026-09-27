import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'

export default defineEventHandler(async () => {
  try {
    return await createThemeService(useThemeRepository()).list()
  }
  catch (error) {
    themeHttpError(error)
  }
})
