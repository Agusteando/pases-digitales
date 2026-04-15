import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { condition_plantel, condition_puesto, target_val, channel, phone } = body
  
  if (!target_val) {
    throw createError({ statusCode: 400, message: 'Falta el destinatario de la notificación.' })
  }

  const resolvedChannel = channel || 'EMAIL'
  if (!['EMAIL', 'WHATSAPP'].includes(resolvedChannel)) {
    throw createError({ statusCode: 400, message: 'Canal de distribución inválido. Solo se permite EMAIL o WHATSAPP.' })
  }

  if (resolvedChannel === 'WHATSAPP' && phone) {
    try {
      let finalPhone = String(phone).replace(/\D/g, '').substring(0, 10)
      if (finalPhone.length > 0) {
        await updateWorkspaceUserPhone(target_val, finalPhone)
      }
    } catch (e) {
      console.warn(`Failed to sync phone for ${target_val}`, e)
    }
  }

  const db = useDB()
  try {
    await db.execute(
      'INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel) VALUES (?, ?, ?, ?, ?)', 
      [
        cleanPlantelName(condition_plantel) || 'ALL', 
        condition_puesto || 'ALL', 
        'CONTACT', 
        target_val,
        resolvedChannel
      ]
    )
    return { success: true }
  } catch (error) {
    console.error('Rule insert error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo guardar la regla específica.' })
  }
})