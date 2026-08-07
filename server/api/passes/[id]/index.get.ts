

import { useDB } from '~/server/utils/db'
import { cleanPlantelName, getFastSoapEmployees } from '~/server/utils/employee-engine'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, getCookie, useRuntimeConfig, createError } from '#imports'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'

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

    const normalizedPlantel = cleanPlantelName(pass.plantel)
    const authorization = await resolveExclusiveAuthorizationForPass({ ...pass, plantel: normalizedPlantel })

    let viewerEmail = ''
    let hasAuthenticatedViewer = false
    try {
      const token = getCookie(event, 'auth-token')
      const decoded: any = token ? jwt.verify(token, useRuntimeConfig().jwtSecret) : null
      viewerEmail = String(decoded?.email || '').trim().toLowerCase()
      hasAuthenticatedViewer = Boolean(viewerEmail)
    } catch {}

    const [logRows]: any = await db.execute('SELECT chat_id, status, error_text, created_at FROM notification_logs WHERE pass_id = ? ORDER BY id DESC', [id])

    return {
      ...pass,
      plantel: normalizedPlantel,
      notifications: logRows,
      authorization_policy: {
        source: authorization.source,
        sourceLabel: authorization.sourceLabel,
        isExclusive: authorization.isExclusive,
        viewerCanResolve: !authorization.isExclusive || isAuthorizedEmail(authorization, viewerEmail),
        employeePuesto: authorization.employeePuesto,
        employeeArea: authorization.employeeArea,
        targets: hasAuthenticatedViewer
          ? authorization.targets.map((target) => ({
              email: target.email,
              name: target.name,
              photoUrl: target.photoUrl,
              channels: target.channels
            }))
          : []
      }
    }
  } catch (error: any) {
    console.error('Fetch pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar la información del registro.' })
  }
})