import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAuthenticated } from '~/server/utils/access'
import { getWorkspaceUser } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  requireAuthenticated(event)
  const email = String(getQuery(event).email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Falta el usuario de Workspace.' })
  }

  const user = await getWorkspaceUser(email)
  return {
    email,
    name: user?.name || '',
    photoUrl: user?.photoUrl || null,
    phone: user?.phone || ''
  }
})
