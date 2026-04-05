import { useDB } from '~/server/utils/db'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { condition_plantel, condition_puesto, target_val } = body
  
  if (!target_val) {
    throw createError({ statusCode: 400, message: 'Falta el contacto de destino para la notificación.' })
  }

  const db = useDB()
  
  try {
    // Note: target_type is strictly enforced as CONTACT.
    await db.execute(
      'INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val) VALUES (?, ?, ?, ?)', 
      [
        condition_plantel || 'ALL', 
        condition_puesto || 'ALL', 
        'CONTACT', 
        target_val
      ]
    )
    return { success: true }
  } catch (error) {
    console.error('Rule insert error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo guardar la regla.' })
  }
})