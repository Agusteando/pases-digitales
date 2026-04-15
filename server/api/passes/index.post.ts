import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import jwt from 'jsonwebtoken'
import { getCookie, createError, defineEventHandler, readBody } from '#imports'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import crypto from 'crypto'

dayjs.extend(utc)
dayjs.extend(timezone)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = useDB()
  
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida' })

  let actingUser = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) {
      actingUser = decoded.name
    }
  } catch (e) {}

  if (!actingUser) throw createError({ statusCode: 401, message: 'Sesión inválida' })

  const { 
    employeeName, curp, ingressioId, categoryId, date, endDate, time, comentarios, 
    plantel, regreso, horaRegreso, imss, tipoIncapacidad, tipoPermiso, autoAuthorize, scheduleTg
  } = body

  // Anclaje de evaluación temporal a zona local para prevenir inserciones con saltos de día por UTC
  const nowTz = dayjs().tz('America/Mexico_City')
  
  const dateObj = date ? dayjs.tz(date, 'America/Mexico_City').startOf('day') : nowTz.startOf('day')
  const endDateObj = endDate ? dayjs.tz(endDate, 'America/Mexico_City').startOf('day') : dateObj
  const todayObj = nowTz.startOf('day')

  if (dateObj.isBefore(todayObj) || endDateObj.isBefore(todayObj)) {
    throw createError({ statusCode: 400, message: 'No se permite registrar pases con fechas en el pasado.' })
  }

  const mysqlDate = dateObj.format('YYYY-MM-DD 00:00:00')
  const mysqlEndDate = endDate ? endDateObj.format('YYYY-MM-DD 23:59:59') : mysqlDate
  
  const authToken = crypto.randomBytes(8).toString('hex') 
  
  const initialStatus = autoAuthorize ? 'autorizado' : 'pendiente'
  const authorizedBy = autoAuthorize ? actingUser : null
  const authorizedAt = autoAuthorize ? nowTz.format('YYYY-MM-DD HH:mm:ss') : null
  
  const sql = `
    INSERT INTO hr_entries 
    (user, employee_name, curp, ingressioId, category_id, date, fecha_fin, time, comentarios, plantel, regreso, hora_regreso, status, auth_token, sync_request, IMSS, tipo_incapacidad, tipo_permiso, authorized_by, authorized_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `
  
  try {
    const [result]: any = await db.execute(sql, [
      actingUser,
      employeeName, 
      curp || null,
      ingressioId || null,
      categoryId, 
      mysqlDate, 
      mysqlEndDate, 
      time || null, 
      comentarios || null, 
      cleanPlantelName(plantel) || null, 
      regreso ? 1 : 0, 
      horaRegreso || null,
      initialStatus,
      authToken,
      imss || null,
      categoryId === 5 ? tipoIncapacidad : null,
      tipoPermiso || null,
      authorizedBy,
      authorizedAt
    ])

    await dispatchNotificationsForPass(result.insertId, { scheduleTg })

    return { success: true, id: result.insertId, auth_token: authToken }
  } catch (error) {
    console.error("Database insert error:", error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error al registrar en la base de datos.'
    })
  }
})