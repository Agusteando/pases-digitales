import { useDB } from '~/server/utils/db'
import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(async () => {
  try {
    const db = useDB()
    const [rows] = await db.execute(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 50`)
    return rows
  } catch (error) {
    console.error("DB Error reading notification logs", error)
    throw createError({ statusCode: 500, message: 'Fallo al consultar los registros de distribución.' })
  }
})