import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { verifyRecipientToken } from '~/server/utils/token'
import { resolveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'
import { defineEventHandler, getRouterParam, getQuery, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const rToken = query.r as string

  if (!token) throw createError({ statusCode: 400, message: 'Enlace malformado o incompleto.' })
  if (!rToken) throw createError({ statusCode: 401, message: 'Identidad del destinatario ausente. Asegúrate de usar el enlace exacto enviado a tu dispositivo.' })

  let recipientName = ''
  let recipientEmail = ''

  try {
    const decoded = verifyRecipientToken(rToken)
    if (decoded?.name && decoded?.email) {
      recipientName = decoded.name
      recipientEmail = decoded.email
    } else throw new Error()
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Firma de enlace inválida o expirada.' })
  }

  const db = useDB()

  try {
    const [rows]: any = await db.execute(
      `SELECT id, employee_name, curp, date, fecha_fin, time, comentarios, category_id, status, plantel, tipo_permiso, user, authorized_by, authorized_at, horario_entrada, horario_salida 
       FROM hr_entries WHERE auth_token = ?`,
      [token]
    )
    if (!rows.length) throw createError({ statusCode: 404, message: 'Documento seguro no encontrado.' })

    const pass = rows[0]
    pass.plantel = cleanPlantelName(pass.plantel)
    const authorization = await resolveAuthorizationForPass(pass)
    const viewerAuthorized = isAuthorizedEmail(authorization, recipientEmail)

    return {
      ...pass,
      _viewer: recipientName,
      _viewerEmail: recipientEmail,
      _viewerAuthorized: viewerAuthorized,
      authorization_policy: {
        source: authorization.source,
        sourceLabel: authorization.sourceLabel,
        isExclusive: authorization.isExclusive,
        employeePuesto: authorization.employeePuesto,
        employeePlantel: authorization.employeePlantel,
        requiredText: authorization.requiredText,
        targets: authorization.targets.map((target) => ({
          email: target.email,
          name: target.name,
          channels: target.channels,
          phone: target.phone
        }))
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar los datos del documento.' })
  }
})
