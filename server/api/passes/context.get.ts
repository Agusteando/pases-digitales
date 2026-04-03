import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeName = query.employeeName as string

  if (!employeeName) {
    return []
  }

  const db = useDB()

  try {
    // Upgraded query fetching 'user' to distinguish ownership (Admin vs Plantel)
    const [rows] = await db.execute(
      `SELECT id, date, time, comentarios, category_id, status, user, plantel 
       FROM hr_entries 
       WHERE employee_name = ? 
       ORDER BY date DESC LIMIT 10`,
      [employeeName]
    )
    return rows
  } catch (error) {
    console.error("Database read error:", error)
    return []
  }
})