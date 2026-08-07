import { useDB, withDBTransaction, type DBClient } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'

const normalizeRuleValue = (value: any) => String(value || '').trim()
const normalizeComparable = (value: any) => normalizeRuleValue(value).toLowerCase()

export type AuthorizationScopeType = 'PERSON' | 'AREA'

export type AuthorizationScopeGrantRow = {
  id: number
  authorizer_email: string
  scope_type: AuthorizationScopeType
  scope_value: string
  condition_plantel: string
  channel: string
}

let missingTableLogged = false

export function isAuthorizationScopeTableMissing(error: any) {
  return error?.code === 'ER_NO_SUCH_TABLE' || Number(error?.errno) === 1146
}

export function authorizationScopeSchemaMessage() {
  return 'La extensión de autorizaciones requiere aplicar database/migrations/20260807_authorization_scope_grants.sql.'
}

export async function getAuthorizationScopeGrants(): Promise<AuthorizationScopeGrantRow[]> {
  const db = useDB()
  try {
    const [rows]: any = await db.execute(
      `SELECT id, authorizer_email, scope_type, scope_value, condition_plantel, channel
       FROM authorization_scope_grants
       ORDER BY id ASC`
    )

    return rows.map((row: any) => ({
      id: Number(row.id),
      authorizer_email: normalizeRuleValue(row.authorizer_email).toLowerCase(),
      scope_type: normalizeRuleValue(row.scope_type).toUpperCase() as AuthorizationScopeType,
      scope_value: normalizeRuleValue(row.scope_value),
      condition_plantel: cleanPlantelName(row.condition_plantel) || 'ALL',
      channel: normalizeRuleValue(row.channel || 'EMAIL').toUpperCase()
    })).filter((row: AuthorizationScopeGrantRow) => ['PERSON', 'AREA'].includes(row.scope_type) && Boolean(row.authorizer_email && row.scope_value))
  } catch (error: any) {
    if (isAuthorizationScopeTableMissing(error)) {
      if (!missingTableLogged) {
        missingTableLogged = true
        console.warn(`[authorization-flow] ${authorizationScopeSchemaMessage()} Existing puesto/plantel rules remain available.`)
      }
      return []
    }
    throw error
  }
}

export function extractAreaFromSigniaRow(row: any) {
  if (!row || typeof row !== 'object') return ''
  const candidates = [
    row.area,
    row.Area,
    row.area_name,
    row.areaName,
    row.nombre_area,
    row.NombreArea,
    row.departamento,
    row.Departamento,
    row.department,
    row.Department,
    row.unidad,
    row.Unidad,
    row.unidad_organizacional,
    row.unidadOrganizacional
  ]
  return normalizeRuleValue(candidates.find((value) => normalizeRuleValue(value)))
}

export function selectPersonScopeGrants(grants: AuthorizationScopeGrantRow[], curp: string) {
  const curpKey = normalizeComparable(curp)
  if (!curpKey) return []
  return grants.filter((grant) => grant.scope_type === 'PERSON' && normalizeComparable(grant.scope_value) === curpKey)
}

export function selectAreaScopeGrants(grants: AuthorizationScopeGrantRow[], plantel: string, area: string, global = false) {
  const areaKey = normalizeComparable(area)
  if (!areaKey) return []
  const plantelKey = normalizeComparable(plantel)

  return grants.filter((grant) => {
    if (grant.scope_type !== 'AREA' || normalizeComparable(grant.scope_value) !== areaKey) return false
    const grantPlantel = normalizeComparable(grant.condition_plantel)
    if (global) return grantPlantel === 'all' || grantPlantel === 'toda la institución'
    return grantPlantel === plantelKey
  })
}

export async function replaceScopeGrantChannels(input: {
  authorizerEmail: string
  scopeType: AuthorizationScopeType
  scopeValue: string
  plantel?: string
  channels: string[]
}) {
  const email = normalizeRuleValue(input.authorizerEmail).toLowerCase()
  const scopeType = normalizeRuleValue(input.scopeType).toUpperCase() as AuthorizationScopeType
  const scopeValue = normalizeRuleValue(input.scopeValue)
  const plantel = cleanPlantelName(input.plantel) || 'ALL'
  const channels = Array.from(new Set(input.channels.map((channel) => normalizeRuleValue(channel).toUpperCase()).filter((channel) => ['EMAIL', 'WHATSAPP'].includes(channel))))

  if (!email || !scopeValue || !['PERSON', 'AREA'].includes(scopeType) || !channels.length) {
    throw new Error('INVALID_SCOPE_GRANT')
  }

  return withDBTransaction(async (db) => {
    await ensureAuthorizationScopeSchemaAvailable(db)
    await db.execute(
      `DELETE FROM authorization_scope_grants
       WHERE authorizer_email = ? AND scope_type = ? AND scope_value = ? AND condition_plantel = ?`,
      [email, scopeType, scopeValue, plantel]
    )

    for (const channel of channels) {
      await db.execute(
        `INSERT INTO authorization_scope_grants (authorizer_email, scope_type, scope_value, condition_plantel, channel)
         VALUES (?, ?, ?, ?, ?)`,
        [email, scopeType, scopeValue, plantel, channel]
      )
    }
  })
}

export async function deleteScopeGrant(input: {
  authorizerEmail: string
  scopeType: AuthorizationScopeType
  scopeValue: string
  plantel?: string
}) {
  const email = normalizeRuleValue(input.authorizerEmail).toLowerCase()
  const scopeType = normalizeRuleValue(input.scopeType).toUpperCase() as AuthorizationScopeType
  const scopeValue = normalizeRuleValue(input.scopeValue)
  const plantel = cleanPlantelName(input.plantel) || 'ALL'

  return withDBTransaction(async (db) => {
    await ensureAuthorizationScopeSchemaAvailable(db)
    await db.execute(
      `DELETE FROM authorization_scope_grants
       WHERE authorizer_email = ? AND scope_type = ? AND scope_value = ? AND condition_plantel = ?`,
      [email, scopeType, scopeValue, plantel]
    )
  })
}

export async function deleteAllScopeGrantsForAuthorizer(authorizerEmail: string, dbOverride?: DBClient) {
  const email = normalizeRuleValue(authorizerEmail).toLowerCase()
  if (!email) return

  if (dbOverride) {
    try {
      await dbOverride.execute('DELETE FROM authorization_scope_grants WHERE authorizer_email = ?', [email])
    } catch (error: any) {
      if (!isAuthorizationScopeTableMissing(error)) throw error
    }
    return
  }

  const db = useDB()
  try {
    await db.execute('DELETE FROM authorization_scope_grants WHERE authorizer_email = ?', [email])
  } catch (error: any) {
    if (!isAuthorizationScopeTableMissing(error)) throw error
  }
}

export async function ensureAuthorizationScopeSchemaAvailable(dbOverride?: DBClient) {
  const db = dbOverride || useDB()
  try {
    await db.execute('SELECT id FROM authorization_scope_grants LIMIT 1')
  } catch (error: any) {
    if (isAuthorizationScopeTableMissing(error)) {
      const schemaError: any = new Error(authorizationScopeSchemaMessage())
      schemaError.code = 'AUTHORIZATION_SCOPE_SCHEMA_MISSING'
      throw schemaError
    }
    throw error
  }
}
