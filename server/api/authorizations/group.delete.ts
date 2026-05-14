import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { normalizeRuleValue } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const plantel = normalizeRuleValue(cleanPlantelName(query.plantel) || query.plantel || '')
  const puesto = normalizeRuleValue(query.puesto || '')

  if (!plantel || !puesto) {
    throw createError({ statusCode: 400, message: 'Faltan plantel o puesto para eliminar la regla.' })
  }

  try {
    const db = useDB()
    await db.execute(
      'DELETE FROM notification_rules WHERE condition_plantel = ? AND condition_puesto = ?',
      [plantel, puesto]
    )
    return { success: true }
  } catch (error) {
    console.error('Authorization group delete error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo eliminar la regla de autorización.' })
  }
})
