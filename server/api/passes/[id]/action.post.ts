import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { getCookie, defineEventHandler, getRouterParam, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { action } = body
  
  if (!id || !action) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos' })
  }

  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida' })

  let actingUser = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingUser = decoded.name
  } catch (e) {}

  if (!actingUser) throw createError({ statusCode: 401, message: 'Sesión inválida' })

  const db = useDB()

  try {
    const [rows]: any = await db.execute(`SELECT user FROM hr_entries WHERE id = ?`, [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

    const pass = rows[0]

    // Resend Notification Action
    if (action === 'resend') {
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true }
    } 
    
    // Cancel Action
    if (action === 'cancel') {
      if (pass.user !== actingUser) {
        throw createError({ statusCode: 403, message: 'Solo el creador original puede anular este pase.' })
      }
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