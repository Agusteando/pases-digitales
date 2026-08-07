

import { useDB } from '~/server/utils/db'
import { cleanPlantelName, getFastSoapEmployees } from '~/server/utils/employee-engine'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, getCookie, createError } from '#imports'

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
    const storedCurp = pass.curp

    // Fetch curp deterministically from SOAP by exact name string
    const dataset = await getFastSoapEmployees()
    const soapEmp = dataset.find(e => e.name === pass.employee_name)
    pass.curp = soapEmp?.curp || null

    const [logRows]: any = await db.execute('SELECT chat_id, status, error_text, created_at FROM notification_logs WHERE pass_id = ? ORDER BY id DESC', [id])

    const token = getCookie(event, 'auth-token')
    const decoded: any = token ? jwt.decode(token) : null
    const actingEmail = String(decoded?.email || '').trim().toLowerCase()
    let authorizationPolicy: any = {
      isExclusive: false,
      canAuthorize: true,
      source: 'UNAVAILABLE',
      requiredText: '',
      targets: []
    }

    try {
      const authorization = await resolveExclusiveAuthorizationForPass({ ...pass, curp: storedCurp || soapEmp?.curp || null })
      authorizationPolicy = {
        isExclusive: authorization.isExclusive,
        canAuthorize: !authorization.isExclusive || (actingEmail ? isAuthorizedEmail(authorization, actingEmail) : false),
        source: authorization.source,
        requiredText: actingEmail && authorization.isExclusive ? authorization.requiredText : '',
        targets: actingEmail && authorization.isExclusive
          ? authorization.targets.map((target) => ({
              name: target.name,
              email: target.email,
              photoUrl: target.photoUrl || null
            }))
          : []
      }
    } catch (authorizationError) {
      console.warn('Authorization policy preview unavailable for pass detail:', authorizationError)
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