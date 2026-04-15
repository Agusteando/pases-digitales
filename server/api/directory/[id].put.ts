import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email, channel, phone, role } = body
  
  if (!id || !email) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos.' })
  }

  const db = useDB()
  const resolvedChannel = channel || 'EMAIL'

  let finalPhone = ''
  if (phone) {
    finalPhone = String(phone).replace(/\D/g, '').substring(0, 10)
  }

  try {
    if (finalPhone) {
      await updateWorkspaceUserPhone(email, finalPhone)
    }
    
    await db.execute('UPDATE hr_directory SET channel = ?, role = ? WHERE id = ?', [resolvedChannel, role, id])

    return { success: true }
  } catch (error) {
    console.error('Update directory error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al actualizar el contacto en la red.' })
  }
})