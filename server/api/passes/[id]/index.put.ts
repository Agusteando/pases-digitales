

import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { PASS_TIME_ZONE, categoryUsesEndDate, parseMexicoCityDateOnly } from '~/server/utils/passDates'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, readBody, getCookie, createError } from '#imports'

dayjs.extend(utc)
dayjs.extend(timezone)


const PERMANENT_SPECIAL_CATEGORY_ID = 6
const VALID_PERMANENT_WEEKDAYS = new Set(['1', '2', '3', '4', '5', '6', '7'])

const normalizePermanentWeekdays = (value: any) => {
  const raw = Array.isArray(value) ? value : String(value || '').split(',')
  const unique = Array.from(new Set(
    raw
      .map((day: any) => String(day).trim())
      .filter((day: string) => VALID_PERMANENT_WEEKDAYS.has(day))
  ))
  return unique.sort((a, b) => Number(a) - Number(b)).join(',')
}

const isValidTime = (value: any) => /^\d{2}:\d{2}(:\d{2})?$/.test(String(value || '').trim())

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
    const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
    const isAdmin = adminRows.length > 0 && adminRows[0].is_admin === 1

    const [rows]: any = await db.execute('SELECT date, status, user FROM hr_entries WHERE id = ?', [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })

    const pass = rows[0]

    if (pass.user !== actingName && !isAdmin) {
      throw createError({ statusCode: 403, message: 'Permisos insuficientes. Solo el creador original o un administrador pueden modificar este pase.' })
    }
    
    if (pass.status !== 'pendiente') {
      throw createError({ statusCode: 403, message: 'Operación denegada. No se permite modificar un pase que ya ha sido resuelto o anulado.' })
    }

    const nowTz = dayjs().tz(PASS_TIME_ZONE)
    const hoursDiff = nowTz.diff(dayjs.tz(pass.date, PASS_TIME_ZONE), 'hour')
    
    if (hoursDiff > 48) {
      throw createError({ statusCode: 403, message: 'Operación denegada. El tiempo permitido para edición (48 horas) ha concluido.' })
    }

    const categoryId = Number(body.categoryId)
    const usesEndDate = categoryUsesEndDate(categoryId)
    const mysqlDate = body.date ? parseMexicoCityDateOnly(body.date) : nowTz.startOf('day')

    if (!mysqlDate) {
      throw createError({ statusCode: 400, message: 'La fecha de inicio no es válida.' })
    }

    const parsedEndDate = usesEndDate && body.endDate ? parseMexicoCityDateOnly(body.endDate) : null
    if (usesEndDate && body.endDate && !parsedEndDate) {
      throw createError({ statusCode: 400, message: 'La fecha de término no es válida.' })
    }

    // Las categorías de un solo día ignoran cualquier fecha de término residual del cliente.
    const mysqlEndDate = parsedEndDate || mysqlDate
    const todayObj = nowTz.startOf('day')

    if (mysqlDate.isBefore(todayObj) || mysqlEndDate.isBefore(todayObj)) {
      throw createError({ statusCode: 400, message: 'No se permite actualizar pases con fechas en el pasado.' })
    }

    if (mysqlEndDate.isBefore(mysqlDate)) {
      throw createError({ statusCode: 400, message: 'La fecha de término no puede ser anterior al inicio.' })
    }

    const normalizedPermanentWeekdays = categoryId === PERMANENT_SPECIAL_CATEGORY_ID
      ? normalizePermanentWeekdays(body.permanentWeekdays || body.permanent_weekdays)
      : null

    if (categoryId === PERMANENT_SPECIAL_CATEGORY_ID) {
      if (!body.endDate) {
        throw createError({ statusCode: 400, message: 'El permiso especial permanente requiere fecha de término.' })
      }
      if (!isValidTime(body.time)) {
        throw createError({ statusCode: 400, message: 'El permiso especial permanente requiere una hora diaria de aviso válida.' })
      }
      if (!body.tipoPermiso) {
        throw createError({ statusCode: 400, message: 'El permiso especial permanente requiere tipo de permiso.' })
      }
      if (!normalizedPermanentWeekdays) {
        throw createError({ statusCode: 400, message: 'Selecciona al menos un día de ejecución para el permiso especial permanente.' })
      }
    }

    const sql = `
      UPDATE hr_entries
      SET date = ?, fecha_fin = ?, time = ?, comentarios = ?, category_id = ?, plantel = ?, regreso = ?, hora_regreso = ?, IMSS = ?, tipo_incapacidad = ?, tipo_permiso = ?, horario_entrada = ?, horario_salida = ?, permanent_weekdays = ?
      WHERE id = ?
    `
    await db.execute(sql, [
       mysqlDate.format('YYYY-MM-DD 00:00:00'),
       usesEndDate && body.endDate ? mysqlEndDate.format('YYYY-MM-DD 23:59:59') : mysqlDate.format('YYYY-MM-DD 00:00:00'),
       body.time || null,
       body.comentarios || null,
       categoryId,
       cleanPlantelName(body.plantel) || null,
       body.regreso ? 1 : 0,
       body.horaRegreso || null,
       body.imss || null,
       body.tipoIncapacidad || null,
       body.tipoPermiso || null,
       body.horarioEntrada || null,
       body.horarioSalida || null,
       normalizedPermanentWeekdays,
       id
    ])

    return { success: true }
  } catch (error: any) {
    console.error('Update pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al procesar la actualización en base de datos.' })
  }
})