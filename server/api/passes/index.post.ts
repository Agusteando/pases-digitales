import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { getCookie } from '#imports'
import dayjs from 'dayjs'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDB()
  
  const token = getCookie(event, 'auth-token')
  let actingUser = 'Sistema'
  
  if (token) {
    try {
      const decoded: any = jwt.decode(token)
      if (decoded && decoded.name) {
        actingUser = decoded.name
      }
    } catch (e) {}
  }

  const { 
    employeeName, categoryId, date, endDate, time, comentarios, 
    plantel, regreso, horaRegreso, imss, tipoIncapacidad 
  } = body

  const mysqlDate = date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss')
  const mysqlEndDate = endDate ? dayjs(endDate).format('YYYY-MM-DD 23:59:59') : mysqlDate
  
  // All new passes require explicit authorization
  const authToken = randomUUID()
  const initialStatus = 'pendiente'
  
  const sql = `
    INSERT INTO hr_entries 
    (employee_name, category_id, date, fecha_fin, time, comentarios, plantel, regreso, hora_regreso, status, auth_token, sync_request, IMSS, tipo_incapacidad, user) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `
  
  try {
    const [result]: any = await db.execute(sql, [
      employeeName, 
      categoryId, 
      mysqlDate, 
      mysqlEndDate, 
      time || null, 
      comentarios || '', 
      plantel || 'No Especificado', 
      regreso ? 1 : 0, 
      horaRegreso || null,
      initialStatus,
      authToken,
      imss || null,
      categoryId === 5 ? tipoIncapacidad : null,
      actingUser
    ])

    return { success: true, id: result.insertId, auth_token: authToken }
  } catch (error) {
    console.error("Database insert error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al registrar en la base de datos.'
    })
  }
})