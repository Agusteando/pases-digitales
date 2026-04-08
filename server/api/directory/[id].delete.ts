import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()
  
  try {
    await db.execute('DELETE FROM hr_directory WHERE id = ?', [id])
    return { success: true }
  } catch (error: any) {
    console.error('Directory delete error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo eliminar el contacto.' })
  }
})