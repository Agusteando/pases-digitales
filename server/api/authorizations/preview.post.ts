import jwt from 'jsonwebtoken'
import { defineEventHandler, readBody, getCookie, createError } from '#imports'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida.' })
  const decoded: any = jwt.decode(token)
  const actingEmail = String(decoded?.email || '').trim().toLowerCase()
  if (!actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida o expirada.' })

  const body = await readBody(event)
  const employees = Array.isArray(body?.employees) ? body.employees.slice(0, 30) : []

  const results = await Promise.all(employees.map(async (employee: any) => {
    const authorization = await resolveExclusiveAuthorizationForPass({
      employee_name: employee.name || employee.employeeName,
      curp: employee.curp,
      plantel: employee.plantel,
      puesto: employee.puesto
    })

    return {
      key: employee.key || employee.curp || employee.name,
      employeeName: employee.name || employee.employeeName,
      isExclusive: authorization.isExclusive,
      canAuthorize: !authorization.isExclusive || isAuthorizedEmail(authorization, actingEmail),
      requiredText: authorization.requiredText,
      source: authorization.source,
      targets: authorization.targets.map((target) => ({
        name: target.name,
        email: target.email,
        photoUrl: target.photoUrl || null
      }))
    }
  }))

  return { results }
})
