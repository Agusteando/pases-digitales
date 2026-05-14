import { defineEventHandler, getQuery, createError } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import {
  getEmployeeGroupCounts,
  getNotificationRules,
  getPlantelDirectoryTargets,
  enrichTargets,
  selectEffectiveRules,
  getSourceLabel,
  isAllRuleValue,
  normalizeComparable,
  normalizeRuleValue
} from '~/server/utils/authorizationRules'

function ruleRowsToTargets(rows: any[]) {
  return rows.map((row) => ({
    id: row.id,
    email: row.target_val,
    channel: row.channel || 'EMAIL',
    source: 'RULE'
  }))
}

function hasIncompleteWhatsApp(targets: any[]) {
  return targets.some((target) => target.channels?.includes('WHATSAPP') && !String(target.phone || '').replace(/\D/g, '').slice(-10))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  try {
    const query = getQuery(event)
    const selectedPlantel = normalizeRuleValue(query.plantel || 'ALL') || 'ALL'
    const search = normalizeComparable(query.search || '')
    const statusFilter = normalizeRuleValue(query.status || 'ALL')

    const [{ counts, planteles, puestos }, rules] = await Promise.all([
      getEmployeeGroupCounts(),
      getNotificationRules()
    ])

    const directoryTargets = selectedPlantel !== 'ALL' ? await getPlantelDirectoryTargets(selectedPlantel) : []
    const visiblePuestos = new Set<string>()

    for (const puesto of puestos) {
      const keyPrefix = selectedPlantel === 'ALL' ? '' : `${selectedPlantel}|||`
      if (selectedPlantel === 'ALL') {
        visiblePuestos.add(puesto)
      } else if (counts.has(`${selectedPlantel}|||${puesto}`)) {
        visiblePuestos.add(puesto)
      }
    }

    for (const rule of rules) {
      const appliesToView = selectedPlantel === 'ALL'
        ? isAllRuleValue(rule.condition_plantel)
        : (isAllRuleValue(rule.condition_plantel) || normalizeComparable(rule.condition_plantel) === normalizeComparable(selectedPlantel))
      if (appliesToView && !isAllRuleValue(rule.condition_puesto)) visiblePuestos.add(rule.condition_puesto)
    }

    const rows = []

    for (const puesto of Array.from(visiblePuestos).sort()) {
      let userCount = 0
      if (selectedPlantel === 'ALL') {
        for (const [key, value] of counts.entries()) {
          if (key.endsWith(`|||${puesto}`)) userCount += value
        }
      } else {
        userCount = counts.get(`${selectedPlantel}|||${puesto}`) || 0
      }

      const effectivePlantel = selectedPlantel === 'ALL' ? 'ALL' : selectedPlantel
      const selection = selectEffectiveRules(rules, effectivePlantel, puesto)
      const isConfigured = selection.rows.length > 0
      const targets = isConfigured
        ? await enrichTargets(ruleRowsToTargets(selection.rows))
        : (selectedPlantel === 'ALL' ? [] : directoryTargets)

      const state = !isConfigured && !targets.length
        ? 'UNCONFIGURED'
        : hasIncompleteWhatsApp(targets)
          ? 'INCOMPLETE'
          : selection.source === 'EXACT_PUESTO'
            ? 'OVERRIDE'
            : selection.source === 'GLOBAL_PUESTO'
              ? 'GLOBAL_OVERRIDE'
              : selection.source === 'PLANTEL_DEFAULT'
                ? 'INHERITED'
                : 'STANDARD'

      const row = {
        key: `${selectedPlantel}|||${puesto}`,
        plantel: selectedPlantel,
        puesto,
        userCount,
        source: isConfigured ? selection.source : (targets.length ? 'STANDARD_DIRECTORY' : 'UNCONFIGURED'),
        sourceLabel: isConfigured ? getSourceLabel(selection.source as any) : getSourceLabel(targets.length ? 'STANDARD_DIRECTORY' : 'UNCONFIGURED'),
        isExclusive: isConfigured,
        state,
        targets,
        ruleIds: selection.rows.map((rule: any) => rule.id),
        configuredPlantel: selection.rows[0]?.condition_plantel || null,
        configuredPuesto: selection.rows[0]?.condition_puesto || null
      }

      if (search) {
        const haystack = [row.puesto, row.plantel, row.sourceLabel, ...targets.flatMap((target: any) => [target.email, target.name])].join(' ').toLowerCase()
        if (!haystack.includes(search)) continue
      }

      if (statusFilter === 'PROTECTED' && !row.isExclusive) continue
      if (statusFilter === 'INCOMPLETE' && row.state !== 'INCOMPLETE') continue
      if (statusFilter === 'OVERRIDES' && !['OVERRIDE', 'GLOBAL_OVERRIDE'].includes(row.state)) continue

      rows.push(row)
    }

    const protectedRows = rows.filter((row: any) => row.isExclusive)
    const incompleteRows = rows.filter((row: any) => row.state === 'INCOMPLETE')
    const overrideRows = rows.filter((row: any) => ['OVERRIDE', 'GLOBAL_OVERRIDE'].includes(row.state))

    return {
      selectedPlantel,
      planteles,
      rows,
      catalogPuestos: puestos,
      summary: {
        protectedGroups: protectedRows.length,
        affectedUsers: protectedRows.reduce((sum: number, row: any) => sum + row.userCount, 0),
        incompleteRules: incompleteRows.length,
        activeOverrides: overrideRows.length
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Authorization matrix error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo construir la matriz de autorizaciones.' })
  }
})
