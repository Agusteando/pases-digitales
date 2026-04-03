import { useDB } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = useDB()

  try {
    // Fetch global recent activity across all employees, prioritizing actionable recent entries
    const [rows] = await db.execute(
      `SELECT id, employee_name, date, time, category_id, status, user, plantel 
       FROM hr_entries 
       ORDER BY id DESC 
       LIMIT 30`
    )
    return rows
  } catch (error) {
    console.error("Database read error:", error)
    return []
  }
})