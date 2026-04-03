import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const plantel = query.plantel as string
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const db = useDB()
  let sql = `SELECT id, employee_name, date, fecha_fin, time, comentarios, category_id, status, user, plantel, regreso, hora_regreso, IMSS, tipo_incapacidad, processed FROM hr_entries WHERE 1=1`
  const params: any[] = []

  if (q && q.trim() !== '') {
    // If q looks like a number, search id or name, else just name
    if (!isNaN(Number(q))) {
      sql += ` AND (employee_name LIKE ? OR id = ?)`
      params.push(`%${q.trim()}%`, Number(q))
    } else {
      sql += ` AND employee_name LIKE ?`
      params.push(`%${q.trim()}%`)
    }
  }

  if (plantel && plantel !== '') {
    sql += ` AND plantel = ?`
    params.push(plantel)
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
    const [rows] = await db.execute(sql, params)
    return rows
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
})