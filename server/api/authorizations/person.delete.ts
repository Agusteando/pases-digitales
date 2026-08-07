import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { useDB } from '~/server/utils/db'
import { normalizeRuleValue } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const curp = normalizeRuleValue(getQuery(event).curp).toUpperCase()
  if (!curp) throw createError({ statusCode: 400, message: 'Falta la persona.' })

  try {
    const db = useDB()
    await db.execute('DELETE FROM authorization_person_rules WHERE UPPER(employee_curp) = ?', [curp])
    return { success: true }
  } catch (error: any) {
    console.error('Person authorization delete error:', error)
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146) {
      throw createError({ statusCode: 503, message: 'Falta aplicar la migración de autorizaciones individuales.' })
    }
    throw createError({ statusCode: 500, message: 'No se pudo eliminar la autorización individual.' })
  }
})
