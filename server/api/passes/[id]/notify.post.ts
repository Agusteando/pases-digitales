import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import { defineEventHandler, getRouterParam, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  // Trigger the unified notification dispatch which handles routing, channels, and full database auditing
  const success = await dispatchNotificationsForPass(Number(id))
  
  if (!success) {
    throw createError({ statusCode: 404, message: 'No fue posible ejecutar el motor de distribución para este registro.' })
  }

  return { success: true }
})