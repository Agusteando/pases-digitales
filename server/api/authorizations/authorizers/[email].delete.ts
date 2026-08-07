import { defineEventHandler, getRouterParam, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { deleteAuthorizationAuthorizer } from '~/server/utils/authorizationAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const email = decodeURIComponent(getRouterParam(event, 'email') || '')
  if (!email) throw createError({ statusCode: 400, message: 'Autorizador inválido.' })
  try {
    await deleteAuthorizationAuthorizer(email)
    return { success: true }
  } catch (error: any) {
    console.error('Authorization authorizer delete error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo retirar al autorizador.' })
  }
})
