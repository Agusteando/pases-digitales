import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'

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
    if (!isNaN(Number(q))) {
      sql += ` AND (employee_name LIKE ? OR id = ?)`
      params.push(`%${q.trim()}%`, Number(q))
    } else {
      sql += ` AND employee_name LIKE ?`
      params.push(`%${q.trim()}%`)
    }
  }

  // Si se busca un plantel limpiado, intentamos hacer match con comodines en caso de que 
  // la BD aún contenga datos antiguos con prefijos numéricos que no hayan sido migrados.
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
    const [rows]: any = await db.execute(sql, params)
    return rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
})