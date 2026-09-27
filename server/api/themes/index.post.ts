import { readBody } from 'h3'
import { createThemeService } from '../../utils/theme-service'
import { themeHttpError } from '../../utils/theme-http'
import { useThemeRepository } from '../../utils/theme-repository'

export default defineEventHandler(async (event) => {
  try {
    const theme = await createThemeService(useThemeRepository()).create(await readBody(event))
    return { success: true, id: theme.id }
  }
  catch (error) {
    themeHttpError(error)
  }
})
