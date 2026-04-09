import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const plantel = query.plantel as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  let sql = `SELECT id, employee_name, date, fecha_fin, time, comentarios, category_id, status, user, plantel, regreso, hora_regreso, IMSS, tipo_incapacidad, tipo_permiso, processed FROM hr_entries WHERE 1=1`
  const params: any[] = []

  if (q && q.trim() !== '') {
    if (!isNaN(Number(q))) {
      sql += ` AND (employee_name LIKE ? OR id = ?)`
      params.push(`%${q.trim()}%`, Number(q))
    } else {
      sql += ` AND employee_name LIKE ?`
      params.push(`%${q.trim()}%`)
    }
  }

  if (plantel && plantel !== '') {
    sql += ` AND plantel LIKE ?`
    params.push(`%${plantel}`)
  }

  if (startDate) {
    sql += ` AND date >= ?`
    params.push(`${startDate} 00:00:00`)
  }

  if (endDate) {
    sql += ` AND date <= ?`
    params.push(`${endDate} 23:59:59`)
  }

  sql += ` ORDER BY id DESC LIMIT 100`

  try {
    const db = useDB()
    const [rows]: any = await db.execute(sql, params)
    return rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
  } catch (error) {
    console.error('Search error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al ejecutar la búsqueda de registros en la base de datos.' })
  }
})