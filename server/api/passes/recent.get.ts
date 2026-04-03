import { useDB } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = useDB()

  try {
    const [rows] = await db.execute(
      `SELECT id, employee_name, date, time, category_id, status, user, plantel 
       FROM hr_entries 
       ORDER BY id DESC 
       LIMIT 40`
    )
    return rows
  } catch (error) {
    console.error("Database read error:", error)
    return []
  }
})