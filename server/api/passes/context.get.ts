import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeName = query.employeeName as string

  if (!employeeName) {
    return []
  }

  const db = useDB()

  try {
    // Get the last 5 passes for this specific employee to provide operational context
    const [rows] = await db.execute(
      `SELECT id, date, time, comentarios, category_id, status 
       FROM hr_entries 
       WHERE employee_name = ? 
       ORDER BY date DESC LIMIT 5`,
      [employeeName]
    )
    return rows
  } catch (error) {
    console.error("Database read error:", error)
    // Return empty array rather than failing the whole UI if DB lookup errors out
    return []
  }
})