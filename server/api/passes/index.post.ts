import { useDB } from '~/server/utils/db'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDB()
  const token = getCookie(event, 'auth-token')
  const user = token ? jwt.decode(token).name : 'Admin/Sistema'

  const { employeeName, categoryId, date, endDate, time, comentarios, plantel, regreso, horaRegreso } = body
  
  const sql = `
    INSERT INTO hr_entries 
    (employee_name, category_id, date, fecha_fin, time, comentarios, plantel, regreso, hora_regreso, status, sync_request, user) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'autorizado', 0, ?)
  `
  
  const mysqlDate = date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss')
  const mysqlEndDate = endDate ? dayjs(endDate).format('YYYY-MM-DD 23:59:59') : mysqlDate
  
  try {
    const [result]: any = await db.execute(sql, [
      employeeName, categoryId, mysqlDate, mysqlEndDate, 
      time || null, comentarios || '', plantel, 
      regreso ? 1 : 0, horaRegreso || null, user
    ])
    return { success: true, id: result.insertId }
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to insert database record.' })
  }
})