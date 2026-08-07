import jwt from 'jsonwebtoken'
import { defineEventHandler, readBody, getCookie, useRuntimeConfig, createError } from '#imports'
import { resolveExclusiveAuthorizationForPass, isAuthorizedEmail } from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida.' })

  let viewerEmail = ''
  try {
    const decoded: any = jwt.verify(token, useRuntimeConfig().jwtSecret)
    viewerEmail = String(decoded?.email || '').trim().toLowerCase()
  } catch {
    throw createError({ statusCode: 401, message: 'Sesión inválida o expirada.' })
  }

  const body = await readBody(event)
  const employees = Array.isArray(body?.employees) ? body.employees.slice(0, 30) : []
  if (!employees.length) return []

  const resolutions = await Promise.all(employees.map(async (employee: any) => {
    const resolution = await resolveExclusiveAuthorizationForPass({
      employee_name: employee.name || employee.employeeName,
      curp: employee.curp,
      plantel: employee.plantel,
      puesto: employee.puesto,
      area: employee.area
    })

    return {
      key: String(employee.key || employee.curp || employee.name || ''),
      isExclusive: resolution.isExclusive,
      canDirectAuthorize: !resolution.isExclusive || isAuthorizedEmail(resolution, viewerEmail),
      source: resolution.source,
      sourceLabel: resolution.sourceLabel,
      employeePuesto: resolution.employeePuesto,
      employeeArea: resolution.employeeArea,
      targets: resolution.targets.map((target) => ({
        email: target.email,
        name: target.name,
        photoUrl: target.photoUrl,
        channels: target.channels
      }))
    }
  }))

  return resolutions
})
