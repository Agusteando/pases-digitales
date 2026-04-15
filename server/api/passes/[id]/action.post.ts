import { useDB } from '~/server/utils/db'
import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import jwt from 'jsonwebtoken'
import { getCookie, defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { action, scheduleTg } = body
  
  if (!id || !action) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos.' })
  }

  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida para ejecutar acciones.' })

  let actingName = null
  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingName = decoded.name
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingName || !actingEmail) throw createError({ statusCode: 401, message: 'Sesión de usuario inválida o expirada.' })

  const db = useDB()

  try {
    const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
    const isAdmin = adminRows.length > 0 && adminRows[0].is_admin === 1

    const [rows]: any = await db.execute(`SELECT user, employee_name, status FROM hr_entries WHERE id = ?`, [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'El pase digital no fue encontrado.' })

    const pass = rows[0]

    if (action === 'authorize' || action === 'reject') {
       if (pass.status !== 'pendiente') {
         throw createError({ statusCode: 400, message: `No es posible alterar la decisión. El pase ya ha sido procesado (Estado actual: ${pass.status}).` })
       }
       
       const nowTzStr = dayjs().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss')
       const newStatus = action === 'authorize' ? 'autorizado' : 'rechazado'
       
       await db.execute(`UPDATE hr_entries SET status = ?, authorized_by = ?, authorized_at = ? WHERE id = ?`, [newStatus, actingName, nowTzStr, id])
       await dispatchNotificationsForPass(Number(id), { scheduleTg })
       return { success: true }
    }

    if (action === 'resend') {
      if (pass.user !== actingName && !isAdmin) {
         throw createError({ statusCode: 403, message: 'Permisos insuficientes para reenviar notificaciones. Se requiere ser el creador del registro o un administrador.' })
      }
      if (pass.status !== 'pendiente') {
         throw createError({ statusCode: 403, message: 'No se permite reenviar notificaciones de un pase que ya ha sido resuelto o anulado.' })
      }
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      await dispatchNotificationsForPass(Number(id), { scheduleTg: false })
      return { success: true }
    } 
    
    if (action === 'cancel') {
      if (pass.user !== actingName && !isAdmin) {
        throw createError({ statusCode: 403, message: 'Permisos insuficientes para anular el registro. Se requiere ser el creador o un administrador de plataforma.' })
      }
      if (pass.status !== 'pendiente') {
         throw createError({ statusCode: 403, message: 'Operación denegada. No se puede anular un pase que ya ha sido resuelto por los responsables.' })
      }
      await db.execute(`UPDATE hr_entries SET status = 'cancelado' WHERE id = ?`, [id])
      await dispatchNotificationsForPass(Number(id), { scheduleTg: false })
      return { success: true }
    }

    throw createError({ statusCode: 400, message: 'Acción no reconocida u operación no permitida internamente en el motor de pases.' })
  } catch (error: any) {
    console.error("Action handler execution error:", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Error inesperado al intentar acceder a la base de datos.' })
  }
})