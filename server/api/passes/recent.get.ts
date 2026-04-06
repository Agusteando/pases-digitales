import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'

export default defineEventHandler(async () => {
  const db = useDB()

  try {
    const [rows]: any = await db.execute(
      `SELECT id, employee_name, date, time, category_id, status, user, plantel 
       FROM hr_entries 
       ORDER BY id DESC 
       LIMIT 40`
    )
    return rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
  } catch (error) {
    console.error("Database read error:", error)
    return []
  }
})