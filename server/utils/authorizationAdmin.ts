import { cleanPlantelName, getFastSoapEmployees, getSigniaData } from '~/server/utils/employee-engine'
import { getCachedWorkspaceUser, updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import { useDB, withDBTransaction } from '~/server/utils/db'
import {
  getAuthorizationScopeGrants,
  extractAreaFromSigniaRow,
  ensureAuthorizationScopeSchemaAvailable,
  replaceScopeGrantChannels,
  deleteScopeGrant,
  deleteAllScopeGrantsForAuthorizer,
  type AuthorizationScopeType
} from '~/server/utils/authorizationScopeGrants'
import {
  getNotificationRules,
  isAllRuleValue,
  normalizeComparable,
  normalizePhoneDigits,
  normalizeRuleValue
} from '~/server/utils/authorizationRules'

export type ManagedScopeType = 'PERSON' | 'PLANTEL' | 'PUESTO' | 'AREA'

export type AuthorizationAssignment = {
  key: string
  type: ManagedScopeType
  value: string
  label: string
  plantel: string
  channels: string[]
  userCount?: number
  subtitle?: string
}

export type AuthorizationAuthorizer = {
  email: string
  name: string
  photoUrl?: string | null
  phone: string
  channels: string[]
  scopes: AuthorizationAssignment[]
}

const scopeOrder: Record<ManagedScopeType, number> = {
  PERSON: 0,
  PLANTEL: 1,
  PUESTO: 2,
  AREA: 3
}

export function buildScopeKey(type: ManagedScopeType, value: string, plantel = 'ALL') {
  return `${type}|||${cleanPlantelName(plantel) || 'ALL'}|||${normalizeRuleValue(value)}`
}

function addAssignment(map: Map<string, { email: string; scopes: Map<string, AuthorizationAssignment> }>, emailRaw: any, assignment: AuthorizationAssignment, channelRaw: any) {
  const email = normalizeRuleValue(emailRaw).toLowerCase()
  if (!email) return
  const channel = normalizeRuleValue(channelRaw || 'EMAIL').toUpperCase()
  const authorizer = map.get(email) || { email, scopes: new Map<string, AuthorizationAssignment>() }
  const existing = authorizer.scopes.get(assignment.key)
  if (existing) {
    if (['EMAIL', 'WHATSAPP'].includes(channel) && !existing.channels.includes(channel)) existing.channels.push(channel)
  } else {
    authorizer.scopes.set(assignment.key, {
      ...assignment,
      channels: ['EMAIL', 'WHATSAPP'].includes(channel) ? [channel] : []
    })
  }
  map.set(email, authorizer)
}

export async function getAuthorizationAuthorizers(): Promise<AuthorizationAuthorizer[]> {
  const [rules, grants, soapEmployees, signiaRows] = await Promise.all([
    getNotificationRules(),
    getAuthorizationScopeGrants(),
    getFastSoapEmployees(),
    getSigniaData()
  ])

  const employeeByCurp = new Map<string, any>()
  const signiaByCurp = new Map<string, any>()
  for (const employee of soapEmployees) {
    const key = normalizeComparable(employee.curp)
    if (key) employeeByCurp.set(key, employee)
  }
  for (const row of signiaRows) {
    const key = normalizeComparable(row.curp || row.CURP)
    if (key) signiaByCurp.set(key, row)
  }

  const grouped = new Map<string, { email: string; scopes: Map<string, AuthorizationAssignment> }>()

  for (const rule of rules) {
    const plantel = cleanPlantelName(rule.condition_plantel) || 'ALL'
    const puesto = normalizeRuleValue(rule.condition_puesto) || 'ALL'

    if (isAllRuleValue(puesto) && !isAllRuleValue(plantel)) {
      addAssignment(grouped, rule.target_val, {
        key: buildScopeKey('PLANTEL', plantel, plantel),
        type: 'PLANTEL',
        value: plantel,
        label: plantel,
        plantel,
        channels: []
      }, rule.channel)
    } else if (!isAllRuleValue(puesto)) {
      addAssignment(grouped, rule.target_val, {
        key: buildScopeKey('PUESTO', puesto, plantel),
        type: 'PUESTO',
        value: puesto,
        label: puesto,
        plantel,
        channels: []
      }, rule.channel)
    }
  }

  for (const grant of grants) {
    if (grant.scope_type === 'PERSON') {
      const employee = employeeByCurp.get(normalizeComparable(grant.scope_value))
      const signia = signiaByCurp.get(normalizeComparable(grant.scope_value))
      const puesto = normalizeRuleValue(signia?.puesto)
      const plantel = cleanPlantelName(employee?.plantel) || 'ALL'
      addAssignment(grouped, grant.authorizer_email, {
        key: buildScopeKey('PERSON', grant.scope_value, 'ALL'),
        type: 'PERSON',
        value: grant.scope_value,
        label: employee?.name || grant.scope_value,
        plantel,
        subtitle: [puesto, plantel !== 'ALL' ? plantel : ''].filter(Boolean).join(' · '),
        channels: []
      }, grant.channel)
    } else if (grant.scope_type === 'AREA') {
      addAssignment(grouped, grant.authorizer_email, {
        key: buildScopeKey('AREA', grant.scope_value, grant.condition_plantel),
        type: 'AREA',
        value: grant.scope_value,
        label: grant.scope_value,
        plantel: grant.condition_plantel || 'ALL',
        channels: []
      }, grant.channel)
    }
  }

  const authorizers = await Promise.all(Array.from(grouped.values()).map(async (entry) => {
    const gw = await getCachedWorkspaceUser(entry.email)
    const scopes = Array.from(entry.scopes.values())
      .map((scope) => ({ ...scope, channels: scope.channels.sort() }))
      .sort((a, b) => scopeOrder[a.type] - scopeOrder[b.type] || a.label.localeCompare(b.label) || a.plantel.localeCompare(b.plantel))
    const channels = Array.from(new Set(scopes.flatMap((scope) => scope.channels))).sort()
    return {
      email: entry.email,
      name: gw?.name || entry.email.split('@')[0],
      photoUrl: gw?.photoUrl || null,
      phone: gw?.phone || '',
      channels,
      scopes
    }
  }))

  return authorizers.sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveAuthorizationAssignment(input: {
  authorizerEmail: string
  scopeType: ManagedScopeType
  scopeValue: string
  plantel?: string
  channels: string[]
  phone?: string
}) {
  const authorizerEmail = normalizeRuleValue(input.authorizerEmail).toLowerCase()
  const scopeType = normalizeRuleValue(input.scopeType).toUpperCase() as ManagedScopeType
  const scopeValue = normalizeRuleValue(input.scopeValue)
  const requestedPlantel = cleanPlantelName(input.plantel) || 'ALL'
  const channels = Array.from(new Set((input.channels || []).map((channel) => normalizeRuleValue(channel).toUpperCase()).filter((channel) => ['EMAIL', 'WHATSAPP'].includes(channel))))
  const phone = normalizePhoneDigits(input.phone)

  if (!authorizerEmail || !scopeValue || !['PERSON', 'PLANTEL', 'PUESTO', 'AREA'].includes(scopeType) || !channels.length) {
    throw new Error('INVALID_AUTHORIZATION_ASSIGNMENT')
  }
  if (channels.includes('WHATSAPP') && phone.length !== 10) throw new Error('INVALID_WHATSAPP_PHONE')

  if (scopeType === 'PERSON' || scopeType === 'AREA') await ensureAuthorizationScopeSchemaAvailable()
  if (channels.includes('WHATSAPP') && phone) await updateWorkspaceUserPhone(authorizerEmail, phone)

  if (scopeType === 'PERSON' || scopeType === 'AREA') {
    await replaceScopeGrantChannels({
      authorizerEmail,
      scopeType: scopeType as AuthorizationScopeType,
      scopeValue,
      plantel: scopeType === 'PERSON' ? 'ALL' : requestedPlantel,
      channels
    })
    return
  }

  const conditionPlantel = scopeType === 'PLANTEL' ? scopeValue : requestedPlantel
  const conditionPuesto = scopeType === 'PLANTEL' ? 'ALL' : scopeValue

  await withDBTransaction(async (db) => {
    await db.execute(
      `DELETE FROM notification_rules
       WHERE condition_plantel = ? AND condition_puesto = ? AND target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?`,
      [conditionPlantel, conditionPuesto, authorizerEmail]
    )
    for (const channel of channels) {
      await db.execute(
        `INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel)
         VALUES (?, ?, 'AUTHORIZATION', ?, ?)`,
        [conditionPlantel, conditionPuesto, authorizerEmail, channel]
      )
    }
  })
}

export async function saveAuthorizationAssignmentsBatch(input: {
  authorizerEmail: string
  assignments: Array<{ scopeType: ManagedScopeType; scopeValue: string; plantel?: string }>
  channels: string[]
  phone?: string
}) {
  const authorizerEmail = normalizeRuleValue(input.authorizerEmail).toLowerCase()
  const channels = Array.from(new Set((input.channels || []).map((channel) => normalizeRuleValue(channel).toUpperCase()).filter((channel) => ['EMAIL', 'WHATSAPP'].includes(channel))))
  const phone = normalizePhoneDigits(input.phone)
  const assignments = (input.assignments || []).map((assignment) => ({
    scopeType: normalizeRuleValue(assignment.scopeType).toUpperCase() as ManagedScopeType,
    scopeValue: normalizeRuleValue(assignment.scopeValue),
    plantel: cleanPlantelName(assignment.plantel) || 'ALL'
  })).filter((assignment) => assignment.scopeValue && ['PERSON', 'PLANTEL', 'PUESTO', 'AREA'].includes(assignment.scopeType))

  if (!authorizerEmail || !assignments.length || !channels.length) throw new Error('INVALID_AUTHORIZATION_ASSIGNMENT')
  if (channels.includes('WHATSAPP') && phone.length !== 10) throw new Error('INVALID_WHATSAPP_PHONE')

  const needsExtendedScopes = assignments.some((assignment) => assignment.scopeType === 'PERSON' || assignment.scopeType === 'AREA')
  if (needsExtendedScopes) await ensureAuthorizationScopeSchemaAvailable()
  if (channels.includes('WHATSAPP') && phone) await updateWorkspaceUserPhone(authorizerEmail, phone)

  await withDBTransaction(async (db) => {

    for (const assignment of assignments) {
      if (assignment.scopeType === 'PERSON' || assignment.scopeType === 'AREA') {
        const conditionPlantel = assignment.scopeType === 'PERSON' ? 'ALL' : assignment.plantel
        await db.execute(
          `DELETE FROM authorization_scope_grants
           WHERE authorizer_email = ? AND scope_type = ? AND scope_value = ? AND condition_plantel = ?`,
          [authorizerEmail, assignment.scopeType, assignment.scopeValue, conditionPlantel]
        )
        for (const channel of channels) {
          await db.execute(
            `INSERT INTO authorization_scope_grants (authorizer_email, scope_type, scope_value, condition_plantel, channel)
             VALUES (?, ?, ?, ?, ?)`,
            [authorizerEmail, assignment.scopeType, assignment.scopeValue, conditionPlantel, channel]
          )
        }
        continue
      }

      const conditionPlantel = assignment.scopeType === 'PLANTEL' ? assignment.scopeValue : assignment.plantel
      const conditionPuesto = assignment.scopeType === 'PLANTEL' ? 'ALL' : assignment.scopeValue
      await db.execute(
        `DELETE FROM notification_rules
         WHERE condition_plantel = ? AND condition_puesto = ? AND target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?`,
        [conditionPlantel, conditionPuesto, authorizerEmail]
      )
      for (const channel of channels) {
        await db.execute(
          `INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel)
           VALUES (?, ?, 'AUTHORIZATION', ?, ?)`,
          [conditionPlantel, conditionPuesto, authorizerEmail, channel]
        )
      }
    }
  })
}

export async function deleteAuthorizationAssignment(input: {
  authorizerEmail: string
  scopeType: ManagedScopeType
  scopeValue: string
  plantel?: string
}) {
  const authorizerEmail = normalizeRuleValue(input.authorizerEmail).toLowerCase()
  const scopeType = normalizeRuleValue(input.scopeType).toUpperCase() as ManagedScopeType
  const scopeValue = normalizeRuleValue(input.scopeValue)
  const requestedPlantel = cleanPlantelName(input.plantel) || 'ALL'

  if (!authorizerEmail || !scopeValue || !['PERSON', 'PLANTEL', 'PUESTO', 'AREA'].includes(scopeType)) {
    throw new Error('INVALID_AUTHORIZATION_ASSIGNMENT')
  }

  if (scopeType === 'PERSON' || scopeType === 'AREA') {
    await deleteScopeGrant({
      authorizerEmail,
      scopeType: scopeType as AuthorizationScopeType,
      scopeValue,
      plantel: scopeType === 'PERSON' ? 'ALL' : requestedPlantel
    })
    return
  }

  const conditionPlantel = scopeType === 'PLANTEL' ? scopeValue : requestedPlantel
  const conditionPuesto = scopeType === 'PLANTEL' ? 'ALL' : scopeValue
  const db = useDB()
  await db.execute(
    `DELETE FROM notification_rules
     WHERE condition_plantel = ? AND condition_puesto = ? AND target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?`,
    [conditionPlantel, conditionPuesto, authorizerEmail]
  )
}

export async function deleteAuthorizationAuthorizer(authorizerEmailRaw: string) {
  const authorizerEmail = normalizeRuleValue(authorizerEmailRaw).toLowerCase()
  if (!authorizerEmail) throw new Error('INVALID_AUTHORIZER')

  await withDBTransaction(async (db) => {
    await db.execute("DELETE FROM notification_rules WHERE target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?", [authorizerEmail])
    await deleteAllScopeGrantsForAuthorizer(authorizerEmail, db)
  })
}

export async function getAuthorizationSubjectCatalog(input: {
  type: ManagedScopeType
  query?: string
  plantel?: string
}) {
  const type = normalizeRuleValue(input.type).toUpperCase() as ManagedScopeType
  const search = normalizeComparable(input.query)
  const plantelFilter = cleanPlantelName(input.plantel) || 'ALL'
  const [soapEmployees, signiaRows] = await Promise.all([getFastSoapEmployees(), getSigniaData()])
  const signiaByCurp = new Map<string, any>()
  for (const row of signiaRows) {
    const key = normalizeComparable(row.curp || row.CURP)
    if (key) signiaByCurp.set(key, row)
  }

  const matchesSearch = (...values: any[]) => !search || values.some((value) => normalizeComparable(value).includes(search))

  if (type === 'PERSON') {
    return soapEmployees
      .filter((employee: any) => normalizeRuleValue(employee.curp))
      .filter((employee: any) => matchesSearch(employee.name, employee.curp, employee.email, employee.plantel))
      .slice(0, 30)
      .map((employee: any) => {
        const signia = signiaByCurp.get(normalizeComparable(employee.curp))
        const area = extractAreaFromSigniaRow(signia)
        return {
          type,
          value: employee.curp,
          label: employee.name,
          plantel: cleanPlantelName(employee.plantel) || 'ALL',
          subtitle: [normalizeRuleValue(signia?.puesto), area, cleanPlantelName(employee.plantel)].filter(Boolean).join(' · ')
        }
      })
  }

  if (type === 'PLANTEL') {
    const values = Array.from(new Set(soapEmployees.map((employee: any) => cleanPlantelName(employee.plantel)).filter(Boolean) as string[])).sort()
    return values.filter((value) => matchesSearch(value)).slice(0, 50).map((value) => ({ type, value, label: value, plantel: value }))
  }

  if (type === 'PUESTO') {
    const counts = new Map<string, number>()
    for (const employee of soapEmployees) {
      const plantel = cleanPlantelName(employee.plantel) || 'ALL'
      if (plantelFilter !== 'ALL' && normalizeComparable(plantel) !== normalizeComparable(plantelFilter)) continue
      const signia = signiaByCurp.get(normalizeComparable(employee.curp))
      const puesto = normalizeRuleValue(signia?.puesto)
      if (!puesto) continue
      counts.set(puesto, (counts.get(puesto) || 0) + 1)
    }
    for (const row of signiaRows) {
      const puesto = normalizeRuleValue(row?.puesto)
      if (puesto && plantelFilter === 'ALL' && !counts.has(puesto)) counts.set(puesto, 0)
    }
    return Array.from(counts.entries())
      .filter(([puesto]) => matchesSearch(puesto))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 80)
      .map(([puesto, userCount]) => ({ type, value: puesto, label: puesto, plantel: plantelFilter, userCount }))
  }

  if (type === 'AREA') {
    const counts = new Map<string, number>()
    for (const employee of soapEmployees) {
      const plantel = cleanPlantelName(employee.plantel) || 'ALL'
      if (plantelFilter !== 'ALL' && normalizeComparable(plantel) !== normalizeComparable(plantelFilter)) continue
      const signia = signiaByCurp.get(normalizeComparable(employee.curp))
      const area = extractAreaFromSigniaRow(signia)
      if (!area) continue
      counts.set(area, (counts.get(area) || 0) + 1)
    }
    return Array.from(counts.entries())
      .filter(([area]) => matchesSearch(area))
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 80)
      .map(([area, userCount]) => ({ type, value: area, label: area, plantel: plantelFilter, userCount }))
  }

  return []
}
