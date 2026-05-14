import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail, logAuthorizationDebug } from '~/server/utils/authorizationRules'
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
  const requestId = crypto.randomBytes(4).toString('hex')
  
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida' })

  let actingUser = null
  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.name) actingUser = decoded.name
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingUser || !actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida' })

  const { 
    employeeName, curp, ingressioId, categoryId, date, endDate, time, comentarios, 
    plantel, puesto, regreso, horaRegreso, imss, tipoIncapacidad, tipoPermiso, autoAuthorize, scheduleTg,
    horarioEntrada, horarioSalida
  } = body

  logAuthorizationDebug('Inicio de registro de pase.', {
    requestId,
    employeeName,
    plantel: cleanPlantelName(plantel) || plantel || 'N/A',
    puesto: puesto || 'N/A',
    categoryId,
    autoAuthorize: Boolean(autoAuthorize),
    actor: actingEmail
  })

  const nowTz = dayjs().tz('America/Mexico_City')
  const dateObj = date ? dayjs.tz(date, 'America/Mexico_City').startOf('day') : nowTz.startOf('day')
  const endDateObj = endDate ? dayjs.tz(endDate, 'America/Mexico_City').startOf('day') : dateObj
  const todayObj = nowTz.startOf('day')

  if (dateObj.isBefore(todayObj) || endDateObj.isBefore(todayObj)) {
    logAuthorizationDebug('Registro bloqueado por fecha en pasado.', { requestId, employeeName, date, endDate, actor: actingEmail }, 'warn')
    throw createError({ statusCode: 400, message: 'No se permite registrar pases con fechas en el pasado.' })
  }

  const [lastGlobal]: any = await db.execute('SELECT id, employee_name FROM hr_entries ORDER BY id DESC LIMIT 1')
  if (lastGlobal.length > 0 && lastGlobal[0].employee_name === employeeName) {
    logAuthorizationDebug('Registro bloqueado por duplicado consecutivo.', { requestId, employeeName, existingPassId: lastGlobal[0].id, actor: actingEmail }, 'warn')
    throw createError({ 
      statusCode: 409, 
      message: `DUPLICATE_CONSECUTIVE:${lastGlobal[0].id}`
    })
  }

  const mysqlDate = dateObj.format('YYYY-MM-DD 00:00:00')
  const mysqlEndDate = endDate ? endDateObj.format('YYYY-MM-DD 23:59:59') : mysqlDate
  const normalizedPlantel = cleanPlantelName(plantel) || null
  const exclusiveAuthorization = await resolveExclusiveAuthorizationForPass({ employee_name: employeeName, curp, plantel: normalizedPlantel, puesto })
  
  if (autoAuthorize && exclusiveAuthorization.isExclusive) {
    if (!exclusiveAuthorization.hasTargets || !isAuthorizedEmail(exclusiveAuthorization, actingEmail)) {
      logAuthorizationDebug('Autorizar directamente bloqueado por regla exclusiva.', {
        requestId,
        employeeName,
        plantel: exclusiveAuthorization.employeePlantel,
        puesto: exclusiveAuthorization.employeePuesto,
        source: exclusiveAuthorization.source,
        requiredText: exclusiveAuthorization.requiredText,
        actor: actingEmail,
        authorizedEmails: exclusiveAuthorization.authorizedEmails
      }, 'warn')
      throw createError({
        statusCode: 403,
        message: `Este pase solo puede ser autorizado por ${exclusiveAuthorization.requiredText}. Puedes registrarlo como solicitud para que se envíe al autorizador correcto, pero tu sesión no puede usar “Autorizar directamente” para este grupo.`
      })
    }
  }

  const authToken = crypto.randomBytes(8).toString('hex') 
  const initialStatus = autoAuthorize ? 'autorizado' : 'pendiente'
  const authorizedBy = autoAuthorize ? actingUser : null
  const authorizedAt = autoAuthorize ? nowTz.format('YYYY-MM-DD HH:mm:ss') : null
  
  const sql = `
    INSERT INTO hr_entries 
    (user, employee_name, curp, ingressioId, category_id, date, fecha_fin, time, comentarios, plantel, regreso, hora_regreso, status, auth_token, sync_request, IMSS, tipo_incapacidad, tipo_permiso, authorized_by, authorized_at, horario_entrada, horario_salida) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
  `
  
  let insertId: number
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
      normalizedPlantel, 
      regreso ? 1 : 0, 
      horaRegreso || null,
      initialStatus,
      authToken,
      imss || null,
      categoryId === 5 ? tipoIncapacidad : null,
      tipoPermiso || null,
      authorizedBy,
      authorizedAt,
      horarioEntrada || null,
      horarioSalida || null
    ])
    insertId = result.insertId
  } catch (error: any) {
    logAuthorizationDebug('Error de base de datos al insertar pase.', {
      requestId,
      employeeName,
      actor: actingEmail,
      error: error?.message || String(error),
      code: error?.code
    }, 'error')
    throw createError({
      statusCode: 500,
      message: 'Error al registrar en la base de datos.'
    })
  }

  let notificationWarning: string | null = null
  try {
    await dispatchNotificationsForPass(insertId, { scheduleTg })
  } catch (error: any) {
    notificationWarning = 'El pase fue registrado, pero ocurrió un problema al enviar las notificaciones autorizadas. Revisa los logs de Vercel con el prefijo [authorization-flow].'
    logAuthorizationDebug('Error posterior al registro durante envío de notificaciones autorizadas.', {
      requestId,
      passId: insertId,
      employeeName,
      actor: actingEmail,
      error: error?.message || String(error),
      stack: error?.stack
    }, 'error')
  }

  logAuthorizationDebug('Registro de pase completado.', {
    requestId,
    passId: insertId,
    employeeName,
    status: initialStatus,
    autoAuthorize: Boolean(autoAuthorize),
    notificationWarning: Boolean(notificationWarning)
  })

  return { success: true, id: insertId, auth_token: authToken, notificationWarning }
})
