import { defineEventHandler, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { getAuthorizationAuthorizers } from '~/server/utils/authorizationAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const authorizers = await getAuthorizationAuthorizers()
    return {
      authorizers,
      summary: {
        authorizers: authorizers.length,
        scopes: authorizers.reduce((sum, authorizer) => sum + authorizer.scopes.length, 0),
        people: authorizers.reduce((sum, authorizer) => sum + authorizer.scopes.filter((scope) => scope.type === 'PERSON').length, 0),
        groups: authorizers.reduce((sum, authorizer) => sum + authorizer.scopes.filter((scope) => scope.type !== 'PERSON').length, 0)
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Authorization authorizers error:', error)
    throw createError({ statusCode: 500, message: 'No se pudieron cargar los autorizadores.' })
  }
})
