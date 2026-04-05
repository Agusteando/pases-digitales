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
    const [rows]: any = await db.execute(`SELECT employee_name FROM hr_entries WHERE id = ?`, [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

    if (action === 'resend') {
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true }
    } 
    
    if (action === 'cancel') {
      await db.execute(`UPDATE hr_entries SET status = 'cancelado' WHERE id = ?`, [id])
      return { success: true }
    }

    throw createError({ statusCode: 400, message: 'Acción no reconocida u operación no permitida internamente.' })
  } catch (error: any) {
    console.error("Action error:", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Error en base de datos' })
  }
})