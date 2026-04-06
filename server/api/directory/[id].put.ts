import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email, channel, phone } = body
  
  if (!id || !email) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos.' })
  }

  const resolvedChannel = channel || 'EMAIL'

  // Clean and validate phone if provided
  let finalPhone = ''
  if (phone) {
    let digits = phone.replace(/\D/g, '')
    if (digits.length >= 10) {
      digits = digits.slice(-10)
      finalPhone = `521${digits}@c.us`
    }
  }

  try {
    // If phone is provided, immediately push it to Google Workspace identity
    if (finalPhone) {
      await updateWorkspaceUserPhone(email, finalPhone)
    }
    
    // Update local system delivery preference
    const db = useDB()
    await db.execute('UPDATE hr_directory SET channel = ? WHERE id = ?', [resolvedChannel, id])

    return { success: true }
  } catch (error) {
    console.error('Update directory error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al actualizar el contacto en la red.' })
  }
})