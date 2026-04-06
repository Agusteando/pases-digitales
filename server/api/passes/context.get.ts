import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeName = query.employeeName as string

  if (!employeeName) {
    return []
  }

  const db = useDB()

  try {
    const [rows]: any = await db.execute(
      `SELECT id, date, time, comentarios, category_id, status, user, plantel 
       FROM hr_entries 
       WHERE employee_name = ? 
       ORDER BY date DESC, id DESC LIMIT 15`,
      [employeeName]
    )
    return rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
  } catch (error) {
    console.error("Database read error:", error)
    return []
  }
})