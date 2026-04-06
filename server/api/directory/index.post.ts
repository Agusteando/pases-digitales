import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plantel, email, role, channel, phone } = body
  
  if (!plantel || !email || !role) {
    throw createError({ statusCode: 400, message: 'Datos incompletos. Faltan campos requeridos.' })
  }

  const allowedRoles = ['Director', 'Administrador', 'Lead/Manager']
  if (!allowedRoles.includes(role)) {
    throw createError({ statusCode: 400, message: 'Rol inválido. Opciones permitidas: Director, Administrador, Lead/Manager.' })
  }

  // Update phone bidirectionally to Workspace if provided and channel requires it
  if (channel === 'WHATSAPP' && phone) {
    try {
      await updateWorkspaceUserPhone(email, `521${phone}@c.us`)
    } catch (e) {
      console.warn(`Failed to sync phone for ${email}`, e)
      // Allow proceeding even if sync fails
    }
  }

  const db = useDB()
  try {
    await db.execute(
      'INSERT INTO hr_directory (plantel, email, role, puesto, channel) VALUES (?, ?, ?, NULL, ?)', 
      [plantel, email, role, channel || 'EMAIL']
    )
    return { success: true }
  } catch (error: any) {
    console.error('Directory insert error:', error.message || error)
    if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      throw createError({ statusCode: 503, message: 'Conexión interrumpida. Por favor, reintenta.' })
    }
    throw createError({ statusCode: 500, message: 'No se pudo registrar el contacto.' })
  }
})