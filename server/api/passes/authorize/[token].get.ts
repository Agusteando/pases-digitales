import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Token requerido' })

  const db = useDB()
  
  try {
    const [rows]: any = await db.execute(
      `SELECT id, employee_name, date, time, comentarios, category_id, status, plantel, user, authorized_by, authorized_at 
       FROM hr_entries WHERE auth_token = ?`, 
      [token]
    )
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado o enlace inválido.' })

    return rows[0]
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar los datos del pase.' })
  }
})