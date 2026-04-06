import { useDB } from '~/server/utils/db'
import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import { defineEventHandler, getRouterParam, createError, getCookie } from '#imports'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  // Secure the endpoint: only authenticated creators or admins can trigger a resend operation
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida para reenviar notificaciones.' })

  let actingName = null
  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingName = decoded.name
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingName || !actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida o expirada.' })

  const db = useDB()

  try {
    const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
    const isAdmin = adminRows.length > 0 && adminRows[0].is_admin === 1

    const [rows]: any = await db.execute('SELECT user, status FROM hr_entries WHERE id = ?', [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })
    const pass = rows[0]

    if (pass.user !== actingName && !isAdmin) {
      throw createError({ statusCode: 403, message: 'Permisos insuficientes. Solo el creador original o un administrador pueden reenviar la notificación.' })
    }
    if (pass.status !== 'pendiente') {
      throw createError({ statusCode: 403, message: 'Operación denegada. No se permite notificar un pase que ya ha sido resuelto.' })
    }

    // Trigger the unified notification dispatch which handles routing, channels, new JWTs, and full database auditing
    const success = await dispatchNotificationsForPass(Number(id))
    
    if (!success) {
      throw createError({ statusCode: 404, message: 'No fue posible ejecutar el motor de distribución para este registro. Verifica que el pase exista.' })
    }

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al procesar el reenvío en base de datos.' })
  }
})