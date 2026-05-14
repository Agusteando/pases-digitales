import { useDB } from '~/server/utils/db'
import { cleanPlantelName, getFastSoapEmployees, getSigniaData, normalizeName } from '~/server/utils/employee-engine'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { useRuntimeConfig } from '#imports'

type TargetRow = {
  id?: number
  email: string
  channel?: string
  role?: string
  source?: string
}

export type AuthorizationTarget = {
  email: string
  name: string
  phone: string
  photoUrl?: string | null
  channels: string[]
  ruleIds: number[]
  role?: string
}

export type AuthorizationResolution = {
  employeePlantel: string
  employeePuesto: string
  source: 'EXACT_PUESTO' | 'GLOBAL_PUESTO' | 'PLANTEL_DEFAULT' | 'STANDARD_DIRECTORY' | 'UNCONFIGURED'
  sourceLabel: string
  isExclusive: boolean
  hasTargets: boolean
  targets: AuthorizationTarget[]
  authorizedEmails: string[]
  requiredText: string
}

export const normalizeRuleValue = (value: any) => String(value || '').trim()
export const normalizeComparable = (value: any) => normalizeRuleValue(value).toLowerCase()
export const isAllRuleValue = (value: any) => normalizeComparable(value) === 'all' || normalizeComparable(value) === 'toda la institución'

export function normalizePhoneDigits(phone: any) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('521') && digits.length >= 13) digits = digits.slice(3)
  if (digits.length > 10) digits = digits.slice(-10)
  return digits.slice(0, 10)
}

export function formatAuthorizationTargetList(targets: AuthorizationTarget[]) {
  if (!targets.length) return 'un autorizador configurado'
  return targets.map((target) => target.name || target.email).join(', ')
}

async function resolvePuestoFromSignia(pass: any) {
  const passCurp = normalizeComparable(pass?.curp)
  const passName = normalizeName(pass?.employee_name)
  const signiaRows = await getSigniaData()

  if (passCurp) {
    const byCurp = signiaRows.find((row: any) => normalizeComparable(row.curp || row.CURP) === passCurp)
    if (byCurp?.puesto) return normalizeRuleValue(byCurp.puesto)
  }

  if (passName) {
    const byName = signiaRows.find((row: any) => {
      const candidates = [row.nombre, row.Nombre, row.NombreCompleto, row.employee_name, row.name]
      return candidates.some((candidate: any) => normalizeName(candidate) === passName)
    })
    if (byName?.puesto) return normalizeRuleValue(byName.puesto)
  }

  const config = useRuntimeConfig()
  if (passCurp && config.signiaApiUrl) {
    try {
      const res: any = await $fetch(config.signiaApiUrl as string, { query: { curp: pass.curp.trim() }, timeout: 5000 })
      if (Array.isArray(res) && res.length > 0) {
        const match = res.find((row: any) => normalizeComparable(row.curp || row.CURP) === passCurp) || res[0]
        return normalizeRuleValue(match?.puesto)
      }
      if (res?.puesto) return normalizeRuleValue(res.puesto)
    } catch {
      // Keep the authorization engine deterministic even if enrichment is unavailable.
    }
  }

  return ''
}

export async function resolveEmployeePuesto(pass: any) {
  const direct = normalizeRuleValue(pass?.puesto)
  if (direct) return direct

  const signiaPuesto = await resolvePuestoFromSignia(pass)
  if (signiaPuesto) return signiaPuesto

  const soapEmployees = await getFastSoapEmployees()
  const soapMatch = soapEmployees.find((employee: any) => normalizeName(employee.name) === normalizeName(pass?.employee_name))
  if (soapMatch?.curp) {
    return await resolvePuestoFromSignia({ ...pass, curp: soapMatch.curp })
  }

  return ''
}

export async function getNotificationRules() {
  const db = useDB()
  const [rows]: any = await db.execute(
    `SELECT id, condition_plantel, condition_puesto, target_type, target_val, channel
     FROM notification_rules
     WHERE target_val IS NOT NULL AND target_val <> ''
     ORDER BY id ASC`
  )

  return rows.map((row: any) => ({
    ...row,
    condition_plantel: cleanPlantelName(row.condition_plantel) || 'ALL',
    condition_puesto: normalizeRuleValue(row.condition_puesto) || 'ALL',
    channel: row.channel || 'EMAIL'
  }))
}

export async function enrichTargets(rows: TargetRow[]): Promise<AuthorizationTarget[]> {
  const byEmail = new Map<string, AuthorizationTarget>()

  for (const row of rows) {
    const email = normalizeRuleValue(row.email).toLowerCase()
    if (!email) continue

    let current = byEmail.get(email)
    if (!current) {
      const gw = await getCachedWorkspaceUser(email)
      current = {
        email,
        name: gw?.name || email.split('@')[0],
        phone: gw?.phone || '',
        photoUrl: gw?.photoUrl || null,
        channels: [],
        ruleIds: [],
        role: row.role
      }
      byEmail.set(email, current)
    }

    const channel = normalizeRuleValue(row.channel || 'EMAIL').toUpperCase()
    if ((channel === 'EMAIL' || channel === 'WHATSAPP') && !current.channels.includes(channel)) {
      current.channels.push(channel)
    }
    if (row.id && !current.ruleIds.includes(Number(row.id))) current.ruleIds.push(Number(row.id))
    if (row.role && !current.role) current.role = row.role
  }

  return Array.from(byEmail.values()).map((target) => ({
    ...target,
    channels: target.channels.sort((a, b) => a.localeCompare(b))
  }))
}

export async function getPlantelDirectoryTargets(plantel: string) {
  const db = useDB()
  const [rows]: any = await db.execute(
    'SELECT id, email, channel, role FROM hr_directory WHERE plantel = ? ORDER BY role ASC, email ASC',
    [plantel]
  )

  return enrichTargets(rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    channel: row.channel || 'EMAIL',
    role: row.role,
    source: 'DIRECTORY'
  })))
}

function rulesToTargetRows(rows: any[]): TargetRow[] {
  return rows.map((row) => ({
    id: row.id,
    email: row.target_val,
    channel: row.channel || 'EMAIL',
    source: 'RULE'
  }))
}

export function selectEffectiveRules(rules: any[], plantel: string, puesto: string) {
  const plantelKey = normalizeComparable(plantel)
  const puestoKey = normalizeComparable(puesto)

  const exact = isAllRuleValue(plantel) ? [] : rules.filter((rule) => {
    return normalizeComparable(rule.condition_plantel) === plantelKey &&
      normalizeComparable(rule.condition_puesto) === puestoKey &&
      !isAllRuleValue(rule.condition_puesto)
  })
  if (exact.length) return { source: 'EXACT_PUESTO' as const, rows: exact }

  const globalPuesto = rules.filter((rule) => {
    return isAllRuleValue(rule.condition_plantel) &&
      normalizeComparable(rule.condition_puesto) === puestoKey &&
      !isAllRuleValue(rule.condition_puesto)
  })
  if (globalPuesto.length) return { source: 'GLOBAL_PUESTO' as const, rows: globalPuesto }

  const plantelDefault = rules.filter((rule) => {
    return normalizeComparable(rule.condition_plantel) === plantelKey && isAllRuleValue(rule.condition_puesto)
  })
  if (plantelDefault.length) return { source: 'PLANTEL_DEFAULT' as const, rows: plantelDefault }

  return { source: 'STANDARD_DIRECTORY' as const, rows: [] }
}

export function getSourceLabel(source: AuthorizationResolution['source']) {
  const labels = {
    EXACT_PUESTO: 'Override de puesto por plantel',
    GLOBAL_PUESTO: 'Override global de puesto',
    PLANTEL_DEFAULT: 'Regla general del plantel',
    STANDARD_DIRECTORY: 'Comportamiento estándar',
    UNCONFIGURED: 'Sin autorizadores configurados'
  }
  return labels[source]
}

export async function resolveAuthorizationForPass(pass: any): Promise<AuthorizationResolution> {
  const employeePlantel = cleanPlantelName(pass?.plantel) || ''
  const employeePuesto = await resolveEmployeePuesto(pass)
  const rules = await getNotificationRules()
  const selected = selectEffectiveRules(rules, employeePlantel, employeePuesto)

  if (selected.rows.length) {
    const targets = await enrichTargets(rulesToTargetRows(selected.rows))
    return {
      employeePlantel,
      employeePuesto,
      source: selected.source,
      sourceLabel: getSourceLabel(selected.source),
      isExclusive: true,
      hasTargets: targets.length > 0,
      targets,
      authorizedEmails: targets.map((target) => target.email.toLowerCase()),
      requiredText: formatAuthorizationTargetList(targets)
    }
  }

  const directoryTargets = employeePlantel ? await getPlantelDirectoryTargets(employeePlantel) : []
  const source = directoryTargets.length ? 'STANDARD_DIRECTORY' : 'UNCONFIGURED'

  return {
    employeePlantel,
    employeePuesto,
    source,
    sourceLabel: getSourceLabel(source),
    isExclusive: false,
    hasTargets: directoryTargets.length > 0,
    targets: directoryTargets,
    authorizedEmails: directoryTargets.map((target) => target.email.toLowerCase()),
    requiredText: formatAuthorizationTargetList(directoryTargets)
  }
}

export function isAuthorizedEmail(resolution: AuthorizationResolution, email: string) {
  const normalized = normalizeComparable(email)
  if (!normalized || !resolution.hasTargets) return false
  return resolution.authorizedEmails.includes(normalized)
}

export async function getEmployeeGroupCounts() {
  const [soapEmployees, signiaRows] = await Promise.all([getFastSoapEmployees(), getSigniaData()])
  const signiaByCurp = new Map<string, any>()

  for (const row of signiaRows) {
    const curp = normalizeComparable(row.curp || row.CURP)
    if (curp) signiaByCurp.set(curp, row)
  }

  const counts = new Map<string, number>()
  const planteles = new Set<string>()
  const puestos = new Set<string>()

  for (const employee of soapEmployees) {
    const plantel = cleanPlantelName(employee.plantel)
    if (!plantel) continue

    const signia = signiaByCurp.get(normalizeComparable(employee.curp))
    const puesto = normalizeRuleValue(signia?.puesto)
    if (!puesto) continue

    planteles.add(plantel)
    puestos.add(puesto)
    const key = `${plantel}|||${puesto}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  for (const row of signiaRows) {
    if (row.puesto) puestos.add(normalizeRuleValue(row.puesto))
  }

  return {
    counts,
    planteles: Array.from(planteles).sort(),
    puestos: Array.from(puestos).sort()
  }
}
