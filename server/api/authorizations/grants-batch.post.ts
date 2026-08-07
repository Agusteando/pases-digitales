import { defineEventHandler, readBody, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { saveAuthorizationAssignmentsBatch } from '~/server/utils/authorizationAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  try {
    await saveAuthorizationAssignmentsBatch({
      authorizerEmail: body.authorizerEmail,
      assignments: Array.isArray(body.assignments) ? body.assignments : [],
      channels: body.channels,
      phone: body.phone
    })
    return { success: true, updatedScopes: Array.isArray(body.assignments) ? body.assignments.length : 0 }
  } catch (error: any) {
    if (error?.code === 'AUTHORIZATION_SCOPE_SCHEMA_MISSING') throw createError({ statusCode: 503, message: error.message })
    if (error?.message === 'INVALID_WHATSAPP_PHONE') throw createError({ statusCode: 400, message: 'WhatsApp requiere un número válido de 10 dígitos.' })
    if (error?.message === 'INVALID_AUTHORIZATION_ASSIGNMENT') throw createError({ statusCode: 400, message: 'La asignación está incompleta.' })
    console.error('Authorization batch save error:', error)
    throw createError({ statusCode: 500, message: 'No se pudieron guardar las autorizaciones.' })
  }
})
