import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeName = query.name as string

  if (!employeeName) return []

  const now = dayjs()
  const currentYear = now.year()
  const currentMonth = now.month()
  
  let startYear = currentYear
  let endYear = currentYear + 1
  if (currentMonth < 7) { 
    startYear = currentYear - 1
    endYear = currentYear
  }
  
  const startDate = `${startYear}-08-01 00:00:00`
  const endDate = `${endYear}-07-31 23:59:59`

  const db = useDB()

  try {
    const [rows]: any = await db.execute(
      `SELECT id, date, time, comentarios, category_id, status, user, plantel, authorized_by, authorized_at
       FROM hr_entries 
       WHERE employee_name = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, id DESC`,
      [employeeName, startDate, endDate]
    )

    return {
      cycle: `${startYear}-${endYear}`,
      history: rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
    }
  } catch (error) {
    console.error("Database read error:", error)
    return { cycle: 'Desconocido', history: [] }
  }
})