import { defineEventHandler } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { getFastSoapEmployees } from '~/server/utils/employee-engine'
import {
  enrichTargets,
  getNotificationRules,
  isAllRuleValue,
  isPersonRuleValue,
  normalizeComparable,
  normalizeRuleValue,
  parsePersonRuleCurp
} from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [rules, employees] = await Promise.all([
    getNotificationRules(),
    getFastSoapEmployees()
  ])

  const employeeByCurp = new Map<string, any>()
  for (const employee of employees) {
    const curp = normalizeRuleValue(employee.curp).toUpperCase()
    if (curp) employeeByCurp.set(curp, employee)
  }

  const identities = await enrichTargets(rules.map((rule: any) => ({
    id: rule.id,
    email: rule.target_val,
    channel: rule.channel || 'EMAIL'
  })))
  const identityByEmail = new Map(identities.map((target: any) => [normalizeComparable(target.email), target]))
  const byEmail = new Map<string, any>()

  for (const rule of rules) {
    const email = normalizeComparable(rule.target_val)
    if (!email) continue

    if (!byEmail.has(email)) {
      const identity: any = identityByEmail.get(email)
      byEmail.set(email, {
        email,
        name: identity?.name || email.split('@')[0],
        photoUrl: identity?.photoUrl || null,
        phone: identity?.phone || '',
        scopes: []
      })
    }

    const authorizer = byEmail.get(email)
    const channel = normalizeRuleValue(rule.channel || 'EMAIL').toUpperCase()
    let scope: any

    if (isPersonRuleValue(rule.condition_plantel)) {
      const curp = parsePersonRuleCurp(rule.condition_plantel)
      const employee = employeeByCurp.get(curp)
      scope = {
        key: `PERSON|||${curp}`,
        type: 'PERSON',
        subjectKey: curp,
        label: employee?.name || normalizeRuleValue(rule.condition_puesto) || 'Colaborador no disponible',
        context: employee?.plantel || '',
        channels: []
      }
    } else if (isAllRuleValue(rule.condition_puesto)) {
      const plantel = normalizeRuleValue(rule.condition_plantel) || 'ALL'
      scope = {
        key: `PLANTEL|||${plantel}`,
        type: 'PLANTEL',
        plantel,
        label: isAllRuleValue(plantel) ? 'Toda la institución' : plantel,
        context: '',
        channels: []
      }
    } else {
      const plantel = normalizeRuleValue(rule.condition_plantel) || 'ALL'
      const puesto = normalizeRuleValue(rule.condition_puesto)
      scope = {
        key: `PUESTO|||${plantel}|||${puesto}`,
        type: 'PUESTO',
        plantel,
        puesto,
        label: puesto,
        context: isAllRuleValue(plantel) ? 'Todos los planteles' : plantel,
        channels: []
      }
    }

    const existing = authorizer.scopes.find((item: any) => item.key === scope.key)
    if (existing) {
      if (channel && !existing.channels.includes(channel)) existing.channels.push(channel)
    } else {
      if (channel) scope.channels.push(channel)
      authorizer.scopes.push(scope)
    }
  }

  return Array.from(byEmail.values())
    .map((authorizer: any) => ({
      ...authorizer,
      scopes: authorizer.scopes.sort((a: any, b: any) => {
        const order: Record<string, number> = { PERSON: 0, PLANTEL: 1, PUESTO: 2 }
        return (order[a.type] - order[b.type]) || a.label.localeCompare(b.label, 'es')
      })
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'))
})
