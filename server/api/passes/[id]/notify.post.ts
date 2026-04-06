import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import { defineEventHandler, getRouterParam, createError, getCookie } from '#imports'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  // Secure the endpoint: only authenticated system users can trigger a resend operation
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida para reenviar notificaciones.' })

  let actingUser = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingUser = decoded.name
  } catch (e) {}

  if (!actingUser) throw createError({ statusCode: 401, message: 'Sesión inválida o expirada.' })

  // Trigger the unified notification dispatch which handles routing, channels, new JWTs, and full database auditing
  const success = await dispatchNotificationsForPass(Number(id))
  
  if (!success) {
    throw createError({ statusCode: 404, message: 'No fue posible ejecutar el motor de distribución para este registro. Verifica que el pase exista.' })
  }

  return { success: true }
})