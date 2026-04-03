import { useDB } from '~/server/utils/db'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  // Authentication check would go here via context
  const body = await readBody(event)
  const db = useDB()

  const { employeeName, categoryId, subcategory, date, time, comentarios, plantel, regreso, horaRegreso } = body

  const sql = `
    INSERT INTO hr_entries 
    (employee_name, category_id, subcategory, date, time, comentarios, plantel, regreso, hora_regreso, status, sync_request) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'autorizado', 0)
  `
  
  const mysqlDate = dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  
  const [result]: any = await db.execute(sql, [
    employeeName, categoryId, subcategory || null, mysqlDate, time || null, 
    comentarios, plantel, regreso ? 1 : 0, horaRegreso || null
  ])

  return { success: true, id: result.insertId }
})