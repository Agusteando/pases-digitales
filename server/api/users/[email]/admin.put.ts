import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const email = getRouterParam(event, 'email')
  if (!email) throw createError({ statusCode: 400, message: 'Falta parámetro de usuario' })

  const body = await readBody(event)
  const db = useDB()

  try {
    await db.execute('UPDATE system_users SET is_admin = ? WHERE email = ?', [body.is_admin ? 1 : 0, email])
    return { success: true }
  } catch (error) {
    console.error('Update admin error', error)
    throw createError({ statusCode: 500, message: 'Fallo al actualizar rol de usuario' })
  }
})