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

  // Root-cause fix for Onboarding loop:
  // We must save the phone to the Workspace Identity ANYTIME it is provided, 
  // regardless of the target channel. If we don't, the coverage check will see 
  // it as missing and endlessly re-prompt the user.
  if (phone) {
    try {
      let digits = phone.replace(/\D/g, '')
      if (digits.length === 10) digits = '521' + digits
      let finalPhone = `${digits}@c.us`
      
      await updateWorkspaceUserPhone(email, finalPhone)
    } catch (e) {
      console.warn(`Failed to sync phone for ${email}`, e)
      throw createError({ statusCode: 500, message: 'No se pudo sincronizar el teléfono con Google Workspace. El perfil corporativo debe estar habilitado.' })
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
    throw createError({ statusCode: 500, message: 'No se pudo registrar el contacto en la base de datos.' })
  }
})