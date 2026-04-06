import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import dayjs from 'dayjs'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, readBody, getCookie, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) throw createError({ statusCode: 400, message: 'ID no proporcionado.' })

  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida' })

  let actingName = null
  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingName = decoded.name
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingName || !actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida' })

  const db = useDB()

  try {
    // Verify admin privileges strictly through the database
    const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
    const isAdmin = adminRows.length > 0 && adminRows[0].is_admin === 1

    const [rows]: any = await db.execute('SELECT date, status, user FROM hr_entries WHERE id = ?', [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })

    const pass = rows[0]

    if (pass.user !== actingName && !isAdmin) {
      throw createError({ statusCode: 403, message: 'Permisos insuficientes. Solo el creador original o un administrador pueden modificar este pase.' })
    }
    
    // Server-side strict immutability check
    if (pass.status !== 'pendiente') {
      throw createError({ statusCode: 403, message: 'Operación denegada. No se permite modificar un pase que ya ha sido resuelto o anulado.' })
    }

    const hoursDiff = dayjs().diff(dayjs(pass.date), 'hour')
    if (hoursDiff > 48) {
      throw createError({ statusCode: 403, message: 'Operación denegada. El tiempo permitido para edición (48 horas) ha concluido.' })
    }

    const mysqlDate = body.date ? dayjs(body.date).startOf('day') : dayjs().startOf('day')
    const mysqlEndDate = body.endDate ? dayjs(body.endDate).startOf('day') : mysqlDate
    const todayObj = dayjs().startOf('day')

    // Strict future/present date check
    if (mysqlDate.isBefore(todayObj) || mysqlEndDate.isBefore(todayObj)) {
      throw createError({ statusCode: 400, message: 'No se permite actualizar pases con fechas en el pasado.' })
    }

    const sql = `
      UPDATE hr_entries
      SET date = ?, fecha_fin = ?, time = ?, comentarios = ?, category_id = ?, plantel = ?, regreso = ?, hora_regreso = ?, IMSS = ?, tipo_incapacidad = ?
      WHERE id = ?
    `
    await db.execute(sql, [
       mysqlDate.format('YYYY-MM-DD 00:00:00'),
       mysqlEndDate.format('YYYY-MM-DD 23:59:59'),
       body.time || null,
       body.comentarios || null,
       body.categoryId,
       cleanPlantelName(body.plantel) || null,
       body.regreso ? 1 : 0,
       body.horaRegreso || null,
       body.imss || null,
       body.tipoIncapacidad || null,
       id
    ])

    return { success: true }
  } catch (error: any) {
    console.error('Update pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al procesar la actualización en base de datos.' })
  }
})