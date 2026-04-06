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

  let actingName = null
  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingName = decoded.name
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingName || !actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida' })

  const db = useDB()

  try {
    const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
    const isAdmin = adminRows.length > 0 && adminRows[0].is_admin === 1

    const [rows]: any = await db.execute(`SELECT user, status FROM hr_entries WHERE id = ?`, [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

    const pass = rows[0]

    // Resend Notification Action
    if (action === 'resend') {
      if (pass.user !== actingName && !isAdmin) {
         throw createError({ statusCode: 403, message: 'Permisos insuficientes para reenviar. Requerido ser el creador o un administrador.' })
      }
      if (pass.status !== 'pendiente') {
         throw createError({ statusCode: 403, message: 'No se permite reenviar notificaciones de un pase resuelto o anulado.' })
      }
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true }
    } 
    
    // Cancel Action
    if (action === 'cancel') {
      if (pass.user !== actingName && !isAdmin) {
        throw createError({ statusCode: 403, message: 'Permisos insuficientes para anular. Requerido ser el creador o un administrador.' })
      }
      // Server-side strict immutability check
      if (pass.status !== 'pendiente') {
         throw createError({ statusCode: 403, message: 'Operación denegada. No se puede anular un pase que ya ha sido resuelto.' })
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