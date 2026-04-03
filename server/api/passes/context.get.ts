import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { employeeName } = getQuery(event)
  const db = useDB()

  // Get their last 5 passes to surface context in the UI
  const [rows] = await db.execute(
    `SELECT id, date, time, comentarios, category_id, status 
     FROM hr_entries 
     WHERE employee_name = ? 
     ORDER BY date DESC LIMIT 5`,
    [employeeName]
  )
  return rows
})