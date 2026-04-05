import { useDB } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = useDB()
  try {
    const [rows] = await db.execute(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 50`)
    return rows
  } catch (error) {
    console.error("DB Error reading notification logs", error)
    return []
  }
})