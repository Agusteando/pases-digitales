import { defineEventHandler, readBody, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { normalizePhoneDigits, normalizeRuleValue } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  const employeeCurp = normalizeRuleValue(body.employeeCurp).toUpperCase()
  const employeeName = normalizeRuleValue(body.employeeName)
  const employeePlantel = cleanPlantelName(body.employeePlantel) || null
  const email = normalizeRuleValue(body.email).toLowerCase()
  const channels = Array.isArray(body.channels) ? body.channels.map((value: any) => normalizeRuleValue(value).toUpperCase()) : []
  const phone = normalizePhoneDigits(body.phone)
  const finalChannels = channels.filter((channel: string) => ['EMAIL', 'WHATSAPP'].includes(channel))

  if (!employeeCurp || !employeeName || !email) {
    throw createError({ statusCode: 400, message: 'Faltan persona o autorizador.' })
  }
  if (!finalChannels.length) throw createError({ statusCode: 400, message: 'Selecciona al menos un canal.' })
  if (finalChannels.includes('WHATSAPP') && phone.length !== 10) {
    throw createError({ statusCode: 400, message: 'WhatsApp requiere un número válido de 10 dígitos.' })
  }

  if (phone) {
    try {
      await updateWorkspaceUserPhone(email, phone)
    } catch (error) {
      console.warn(`Failed to sync phone for person authorization rule ${email}`, error)
      throw createError({ statusCode: 500, message: 'No se pudo sincronizar el teléfono con Google Workspace.' })
    }
  }

  const db = useDB()
  try {
    await db.execute('DELETE FROM authorization_person_rules WHERE UPPER(employee_curp) = ?', [employeeCurp])
    for (const channel of finalChannels) {
      await db.execute(
        'INSERT INTO authorization_person_rules (employee_curp, employee_name, employee_plantel, target_val, channel) VALUES (?, ?, ?, ?, ?)',
        [employeeCurp, employeeName, employeePlantel, email, channel]
      )
    }
    return { success: true }
  } catch (error: any) {
    console.error('Person authorization save error:', error)
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
      throw createError({ statusCode: 503, message: 'Falta aplicar la migración de autorizaciones individuales.' })
    }
    throw createError({ statusCode: 500, message: 'No se pudo guardar la autorización individual.' })
  }
})
