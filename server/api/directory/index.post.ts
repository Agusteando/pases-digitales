import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
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

  const resolvedChannel = channel || 'EMAIL'
  if (!['EMAIL', 'WHATSAPP'].includes(resolvedChannel)) {
    throw createError({ statusCode: 400, message: 'Canal de distribución inválido. Solo se permite EMAIL o WHATSAPP.' })
  }

  if (resolvedChannel === 'WHATSAPP' && phone) {
    try {
      await updateWorkspaceUserPhone(email, `521${phone}@c.us`)
    } catch (e) {
      console.warn(`Failed to sync phone for ${email}`, e)
    }
  }

  const db = useDB()
  try {
    await db.execute(
      'INSERT INTO hr_directory (plantel, email, role, puesto, channel) VALUES (?, ?, ?, NULL, ?)', 
      [cleanPlantelName(plantel), email, role, resolvedChannel]
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