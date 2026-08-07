import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { deleteAuthorizationAssignment, type ManagedScopeType } from '~/server/utils/authorizationAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  try {
    await deleteAuthorizationAssignment({
      authorizerEmail: String(query.authorizerEmail || ''),
      scopeType: String(query.scopeType || '').toUpperCase() as ManagedScopeType,
      scopeValue: String(query.scopeValue || ''),
      plantel: String(query.plantel || 'ALL')
    })
    return { success: true }
  } catch (error: any) {
    if (error?.code === 'AUTHORIZATION_SCOPE_SCHEMA_MISSING') {
      throw createError({ statusCode: 503, message: error.message })
    }
    if (error?.message === 'INVALID_AUTHORIZATION_ASSIGNMENT') {
      throw createError({ statusCode: 400, message: 'La asignación es inválida.' })
    }
    console.error('Authorization grant delete error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo retirar la autorización.' })
  }
})
