import { dispatchDuePermanentPassNotifications } from '~/server/utils/permanentPassNotifications'
import { defineEventHandler, createError, getHeader, getQuery, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expectedSecret = String(config.cronSecret || '').trim()

  if (expectedSecret) {
    const authHeader = String(getHeader(event, 'authorization') || '')
    const headerSecret = String(getHeader(event, 'x-cron-secret') || '')
    const querySecret = String(getQuery(event).secret || '')

    const authorized = authHeader === `Bearer ${expectedSecret}` || headerSecret === expectedSecret || querySecret === expectedSecret
    if (!authorized) {
      throw createError({ statusCode: 401, message: 'Cron no autorizado.' })
    }
  }

  return await dispatchDuePermanentPassNotifications()
})
