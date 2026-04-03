import { useDB } from '~/server/utils/db'
import dayjs from 'dayjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDB()

  const { 
    employeeName, categoryId, date, endDate, time, comentarios, 
    plantel, regreso, horaRegreso, imss, tipoIncapacidad 
  } = body

  // We preserve the legacy database structure but populate it cleanly from our modern frontend scenarios
  const sql = `
    INSERT INTO hr_entries 
    (employee_name, category_id, date, fecha_fin, time, comentarios, plantel, regreso, hora_regreso, status, sync_request, IMSS, tipo_incapacidad, user) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'autorizado', 0, ?, ?, 'Admin/Sistema')
  `
  
  const mysqlDate = date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss')
  const mysqlEndDate = endDate ? dayjs(endDate).format('YYYY-MM-DD 23:59:59') : mysqlDate
  
  try {
    const [result]: any = await db.execute(sql, [
      employeeName, 
      categoryId, 
      mysqlDate, 
      mysqlEndDate, 
      time || null, 
      comentarios || '', 
      plantel, 
      regreso ? 1 : 0, 
      horaRegreso || null,
      imss || null,
      categoryId === 5 ? tipoIncapacidad : null // Only apply if it's a medical scenario
    ])

    return { success: true, id: result.insertId }
  } catch (error) {
    console.error("Database insert error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to insert pass into database.'
    })
  }
})