import { defineEventHandler, readBody, createError } from '#imports'
import { requireAuthenticated } from '~/server/utils/access'
import {
  resolveExclusiveAuthorizationForPass,
  resolveGroupExclusiveAuthorizationForPass,
  normalizeRuleValue
} from '~/server/utils/authorizationRules'

function serialize(resolution: any) {
  return {
    source: resolution.source,
    sourceLabel: resolution.sourceLabel,
    isExclusive: resolution.isExclusive,
    employeePlantel: resolution.employeePlantel,
    employeePuesto: resolution.employeePuesto,
    requiredText: resolution.requiredText,
    targets: resolution.targets.map((target: any) => ({
      email: target.email,
      name: target.name,
      photoUrl: target.photoUrl || null,
      phone: target.phone || '',
      channels: target.channels || []
    }))
  }
}

export default defineEventHandler(async (event) => {
  requireAuthenticated(event)
  const body = await readBody(event)

  const passLike = {
    employee_name: normalizeRuleValue(body.employeeName || body.name),
    curp: normalizeRuleValue(body.curp),
    plantel: normalizeRuleValue(body.plantel),
    puesto: normalizeRuleValue(body.puesto)
  }

  if (!passLike.employee_name && !passLike.curp) {
    throw createError({ statusCode: 400, message: 'Falta el colaborador.' })
  }

  const [effective, group] = await Promise.all([
    resolveExclusiveAuthorizationForPass(passLike),
    resolveGroupExclusiveAuthorizationForPass(passLike)
  ])

  return {
    effective: serialize(effective),
    group: serialize(group)
  }
})
