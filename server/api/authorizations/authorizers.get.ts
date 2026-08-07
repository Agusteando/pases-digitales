import { defineEventHandler, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import {
  enrichTargets,
  getEmployeeGroupCounts,
  getNotificationRules,
  getAllPersonAuthorizationRules,
  isAllRuleValue,
  normalizeComparable,
  normalizeRuleValue
} from '~/server/utils/authorizationRules'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  try {
    const [{ counts, planteles, puestos }, rules, personRules] = await Promise.all([
      getEmployeeGroupCounts(),
      getNotificationRules(),
      getAllPersonAuthorizationRules()
    ])

    const targetRows = [
      ...rules.map((row: any) => ({ id: row.id, email: row.target_val, channel: row.channel || 'EMAIL' })),
      ...personRules.map((row: any) => ({ id: row.id, email: row.target_val, channel: row.channel || 'EMAIL' }))
    ]
    const contacts = await enrichTargets(targetRows)
    const contactByEmail = new Map<string, any>(contacts.map((contact: any) => [contact.email.toLowerCase(), contact]))

    const groupTargets = new Map<string, Set<string>>()
    for (const row of rules) {
      const scopeKey = `${normalizeComparable(row.condition_plantel)}|||${normalizeComparable(row.condition_puesto)}`
      if (!groupTargets.has(scopeKey)) groupTargets.set(scopeKey, new Set())
      groupTargets.get(scopeKey)!.add(normalizeRuleValue(row.target_val).toLowerCase())
    }

    const personTargets = new Map<string, Set<string>>()
    for (const row of personRules) {
      const scopeKey = normalizeRuleValue(row.employee_curp).toUpperCase()
      if (!personTargets.has(scopeKey)) personTargets.set(scopeKey, new Set())
      personTargets.get(scopeKey)!.add(normalizeRuleValue(row.target_val).toLowerCase())
    }

    const byEmail = new Map<string, any>()
    const ensureAuthorizer = (emailRaw: string) => {
      const email = normalizeRuleValue(emailRaw).toLowerCase()
      if (!byEmail.has(email)) {
        const contact = contactByEmail.get(email)
        byEmail.set(email, {
          email,
          name: contact?.name || email.split('@')[0],
          phone: contact?.phone || '',
          photoUrl: contact?.photoUrl || null,
          channels: [],
          assignments: []
        })
      }
      return byEmail.get(email)
    }

    const groupedRules = new Map<string, any>()
    for (const row of rules) {
      const email = normalizeRuleValue(row.target_val).toLowerCase()
      const key = `${email}|||${normalizeComparable(row.condition_plantel)}|||${normalizeComparable(row.condition_puesto)}`
      if (!groupedRules.has(key)) {
        groupedRules.set(key, {
          email,
          plantel: normalizeRuleValue(row.condition_plantel) || 'ALL',
          puesto: normalizeRuleValue(row.condition_puesto) || 'ALL',
          channels: [],
          ruleIds: []
        })
      }
      const group = groupedRules.get(key)
      const channel = normalizeRuleValue(row.channel || 'EMAIL').toUpperCase()
      if (channel && !group.channels.includes(channel)) group.channels.push(channel)
      group.ruleIds.push(Number(row.id))
    }

    for (const group of groupedRules.values()) {
      const authorizer = ensureAuthorizer(group.email)
      for (const channel of group.channels) if (!authorizer.channels.includes(channel)) authorizer.channels.push(channel)

      const isGlobalPlantel = isAllRuleValue(group.plantel)
      const isPlantelDefault = !isGlobalPlantel && isAllRuleValue(group.puesto)
      const scopeKey = `${normalizeComparable(group.plantel)}|||${normalizeComparable(group.puesto)}`
      let userCount = 0

      if (isPlantelDefault) {
        for (const [key, value] of counts.entries()) if (key.startsWith(`${group.plantel}|||`)) userCount += value
      } else if (isGlobalPlantel && !isAllRuleValue(group.puesto)) {
        for (const [key, value] of counts.entries()) if (key.endsWith(`|||${group.puesto}`)) userCount += value
      } else if (!isGlobalPlantel && !isAllRuleValue(group.puesto)) {
        userCount = counts.get(`${group.plantel}|||${group.puesto}`) || 0
      }

      authorizer.assignments.push({
        key: `GROUP:${group.plantel}:${group.puesto}`,
        type: isPlantelDefault ? 'PLANTEL' : 'PUESTO',
        plantel: group.plantel,
        puesto: group.puesto,
        label: isPlantelDefault ? group.plantel : group.puesto,
        detail: isPlantelDefault ? 'Plantel' : (isGlobalPlantel ? 'Toda la institución' : group.plantel),
        channels: group.channels.sort(),
        ruleIds: group.ruleIds,
        targetCount: groupTargets.get(scopeKey)?.size || 1,
        userCount
      })
    }

    const groupedPeople = new Map<string, any>()
    for (const row of personRules) {
      const email = normalizeRuleValue(row.target_val).toLowerCase()
      const curp = normalizeRuleValue(row.employee_curp).toUpperCase()
      const key = `${email}|||${curp}`
      if (!groupedPeople.has(key)) {
        groupedPeople.set(key, {
          email,
          curp,
          employeeName: normalizeRuleValue(row.employee_name),
          plantel: normalizeRuleValue(row.employee_plantel),
          channels: [],
          ruleIds: []
        })
      }
      const group = groupedPeople.get(key)
      const channel = normalizeRuleValue(row.channel || 'EMAIL').toUpperCase()
      if (channel && !group.channels.includes(channel)) group.channels.push(channel)
      group.ruleIds.push(Number(row.id))
    }

    for (const group of groupedPeople.values()) {
      const authorizer = ensureAuthorizer(group.email)
      for (const channel of group.channels) if (!authorizer.channels.includes(channel)) authorizer.channels.push(channel)
      authorizer.assignments.push({
        key: `PERSON:${group.curp}`,
        type: 'PERSON',
        employeeCurp: group.curp,
        employeeName: group.employeeName,
        plantel: group.plantel,
        label: group.employeeName,
        detail: group.plantel || 'Persona',
        channels: group.channels.sort(),
        ruleIds: group.ruleIds,
        targetCount: personTargets.get(group.curp)?.size || 1,
        userCount: 1
      })
    }

    const authorizers = Array.from(byEmail.values())
      .map((authorizer) => ({
        ...authorizer,
        channels: authorizer.channels.sort(),
        assignments: authorizer.assignments.sort((a: any, b: any) => {
          const order: Record<string, number> = { PERSON: 0, PLANTEL: 1, PUESTO: 2 }
          return (order[a.type] - order[b.type]) || a.label.localeCompare(b.label)
        })
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return { authorizers, planteles, catalogPuestos: puestos }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Authorization authorizers error:', error)
    throw createError({ statusCode: 500, message: 'No se pudieron cargar los autorizadores.' })
  }
})
