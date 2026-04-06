import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { condition_plantel, condition_puesto, target_val, channel, phone } = body
  
  if (!target_val) {
    throw createError({ statusCode: 400, message: 'Falta el destinatario de la notificación.' })
  }

  // Update phone to Workspace if WhatsApp is chosen and a new phone was provided
  if (channel === 'WHATSAPP' && phone) {
    try {
      await updateWorkspaceUserPhone(target_val, `521${phone}@c.us`)
    } catch (e) {
      console.warn(`Failed to sync phone for ${target_val}`, e)
    }
  }

  const db = useDB()
  try {
    await db.execute(
      'INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel) VALUES (?, ?, ?, ?, ?)', 
      [
        condition_plantel || 'ALL', 
        condition_puesto || 'ALL', 
        'CONTACT', 
        target_val,
        channel || 'EMAIL'
      ]
    )
    return { success: true }
  } catch (error) {
    console.error('Rule insert error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo guardar la regla específica.' })
  }
})