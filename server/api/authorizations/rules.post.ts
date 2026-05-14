import { defineEventHandler, readBody, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { normalizePhoneDigits, normalizeRuleValue } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const plantel = normalizeRuleValue(cleanPlantelName(body.plantel) || body.plantel || 'ALL') || 'ALL'
  const puestos = Array.isArray(body.puestos) ? body.puestos.map(normalizeRuleValue).filter(Boolean) : []
  const email = normalizeRuleValue(body.email).toLowerCase()
  const channels = Array.isArray(body.channels) ? body.channels.map((c: any) => normalizeRuleValue(c).toUpperCase()) : []
  const phone = normalizePhoneDigits(body.phone)
  const replaceExisting = body.replaceExisting !== false

  if (!plantel || !puestos.length || !email) {
    throw createError({ statusCode: 400, message: 'Faltan plantel, puesto o autorizador.' })
  }

  const finalChannels = channels.filter((channel: string) => ['EMAIL', 'WHATSAPP'].includes(channel))
  if (!finalChannels.length) throw createError({ statusCode: 400, message: 'Selecciona al menos un canal autorizado.' })
  if (finalChannels.includes('WHATSAPP') && phone.length !== 10) {
    throw createError({ statusCode: 400, message: 'WhatsApp requiere un número válido de 10 dígitos.' })
  }

  if (phone) {
    try {
      await updateWorkspaceUserPhone(email, phone)
    } catch (error) {
      console.warn(`Failed to sync phone for authorization rule ${email}`, error)
      throw createError({ statusCode: 500, message: 'No se pudo sincronizar el teléfono con Google Workspace.' })
    }
  }

  const db = useDB()

  try {
    for (const puesto of puestos) {
      if (replaceExisting) {
        await db.execute(
          'DELETE FROM notification_rules WHERE condition_plantel = ? AND condition_puesto = ?',
          [plantel, puesto]
        )
      }

      for (const channel of finalChannels) {
        await db.execute(
          'INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel) VALUES (?, ?, ?, ?, ?)',
          [plantel, puesto, 'CONTACT', email, channel]
        )
      }
    }

    return { success: true, updatedGroups: puestos.length }
  } catch (error: any) {
    console.error('Authorization rule save error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo guardar la regla de autorización.' })
  }
})
