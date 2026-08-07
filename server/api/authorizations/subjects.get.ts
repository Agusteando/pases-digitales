import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { getAuthorizationSubjectCatalog, type ManagedScopeType } from '~/server/utils/authorizationAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const type = String(query.type || '').toUpperCase() as ManagedScopeType
  if (!['PERSON', 'PLANTEL', 'PUESTO', 'AREA'].includes(type)) {
    throw createError({ statusCode: 400, message: 'Tipo de alcance inválido.' })
  }
  try {
    return await getAuthorizationSubjectCatalog({ type, query: String(query.q || ''), plantel: String(query.plantel || 'ALL') })
  } catch (error: any) {
    console.error('Authorization subjects error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo cargar el catálogo de alcance.' })
  }
})
