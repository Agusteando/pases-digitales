import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { action } = body
  
  if (!id || !action) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos' })
  }

  const db = useDB()

  try {
    if (action === 'resend') {
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true }
    } 
    
    if (action === 'authorize') {
      await db.execute(`UPDATE hr_entries SET status = 'autorizado' WHERE id = ?`, [id])
      return { success: true }
    }
    
    if (action === 'cancel') {
      await db.execute(`UPDATE hr_entries SET status = 'cancelado' WHERE id = ?`, [id])
      return { success: true }
    }

    throw createError({ statusCode: 400, message: 'Acción no reconocida' })
  } catch (error) {
    console.error("Action error:", error)
    throw createError({ statusCode: 500, message: 'Error en base de datos' })
  }
})