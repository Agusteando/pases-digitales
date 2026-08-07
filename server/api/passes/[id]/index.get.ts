

import { useDB } from '~/server/utils/db'
import { cleanPlantelName, getFastSoapEmployees } from '~/server/utils/employee-engine'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, createError, getCookie } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id || id === 'undefined' || id === 'null') {
    throw createError({ statusCode: 400, message: 'ID de registro inválido o no proporcionado.' })
  }

  const db = useDB()

  try {
    const [passRows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [id])
    if (!passRows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })

    const pass = passRows[0]

    // Fetch curp deterministically from SOAP by exact name string
    const dataset = await getFastSoapEmployees()
    const soapEmp = dataset.find(e => e.name === pass.employee_name)
    pass.curp = soapEmp?.curp || null

    const [logRows]: any = await db.execute('SELECT chat_id, status, error_text, created_at FROM notification_logs WHERE pass_id = ? ORDER BY id DESC', [id])

    let authorizationPolicy: any = null
    try {
      const authorization = await resolveExclusiveAuthorizationForPass(pass)
      const token = getCookie(event, 'auth-token')
      const decoded: any = token ? jwt.decode(token) : null
      const viewerEmail = String(decoded?.email || '').trim().toLowerCase()
      authorizationPolicy = {
        source: authorization.source,
        sourceLabel: authorization.sourceLabel,
        isExclusive: authorization.isExclusive,
        viewerAuthorized: !authorization.isExclusive || isAuthorizedEmail(authorization, viewerEmail),
        requiredText: viewerEmail ? authorization.requiredText : '',
        targets: viewerEmail ? authorization.targets.map((target) => ({
          name: target.name,
          photoUrl: target.photoUrl || null
        })) : []
      }
    } catch (error) {
      console.warn('Authorization visibility unavailable for pass detail.', error)
    }

    return {
      ...pass,
      plantel: cleanPlantelName(pass.plantel),
      notifications: logRows,
      authorization_policy: authorizationPolicy
    }
  } catch (error: any) {
    console.error('Fetch pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar la información del registro.' })
  }
})