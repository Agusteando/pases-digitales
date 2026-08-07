import { defineEventHandler, readBody, createError } from '#imports'
import { requireAuthenticated } from '~/server/utils/access'
import { useDB } from '~/server/utils/db'
import { getFastSoapEmployees, normalizeName } from '~/server/utils/employee-engine'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'
import {
  normalizePhoneDigits,
  normalizeRuleValue,
  personRuleValue
} from '~/server/utils/authorizationRules'

function normalizeChannels(value: any) {
  const channels = Array.isArray(value) ? value : ['EMAIL']
  const valid = Array.from(new Set(channels.map((channel) => normalizeRuleValue(channel).toUpperCase())))
    .filter((channel) => ['EMAIL', 'WHATSAPP'].includes(channel))
  return valid.length ? valid : ['EMAIL']
}

export default defineEventHandler(async (event) => {
  requireAuthenticated(event)
  const body = await readBody(event)
  let curp = normalizeRuleValue(body.curp).toUpperCase()
  const employeeName = normalizeRuleValue(body.employeeName || body.name)
  const mode = ['replace', 'add', 'remove'].includes(body.mode) ? body.mode : 'replace'

  if (!curp && !employeeName) throw createError({ statusCode: 400, message: 'Falta el colaborador.' })

  const employees = await getFastSoapEmployees()
  if (!curp && employeeName) {
    const match = employees.find((item: any) => normalizeName(item.name) === normalizeName(employeeName))
    curp = normalizeRuleValue(match?.curp).toUpperCase()
  }
  const employee = employees.find((item: any) => normalizeRuleValue(item.curp).toUpperCase() === curp)
  if (!employee) throw createError({ statusCode: 404, message: 'No se encontró al colaborador seleccionado.' })

  const ruleValue = personRuleValue(curp)
  const db = useDB()

  if (mode === 'remove') {
    const email = normalizeRuleValue(body.email).toLowerCase()
    if (email) {
      await db.execute(
        "DELETE FROM notification_rules WHERE condition_plantel = ? AND target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?",
        [ruleValue, email]
      )
    } else {
      await db.execute(
        "DELETE FROM notification_rules WHERE condition_plantel = ? AND target_type = 'AUTHORIZATION'",
        [ruleValue]
      )
    }
    return { success: true, employeeName: employee.name }
  }

  const rawAuthorizers = Array.isArray(body.authorizers) ? body.authorizers : []
  const authorizers = rawAuthorizers
    .map((item: any) => ({
      email: normalizeRuleValue(item?.email).toLowerCase(),
      phone: normalizePhoneDigits(item?.phone),
      channels: normalizeChannels(item?.channels)
    }))
    .filter((item: any) => item.email)

  if (mode === 'add' && !authorizers.length) {
    throw createError({ statusCode: 400, message: 'Selecciona al menos un autorizador.' })
  }

  for (const authorizer of authorizers) {
    if (authorizer.channels.includes('WHATSAPP') && authorizer.phone.length !== 10) {
      throw createError({ statusCode: 400, message: 'WhatsApp requiere un número válido de 10 dígitos.' })
    }
  }

  for (const authorizer of authorizers) {
    if (authorizer.phone) {
      await updateWorkspaceUserPhone(authorizer.email, authorizer.phone)
    }
  }

  if (mode === 'replace') {
    await db.execute(
      "DELETE FROM notification_rules WHERE condition_plantel = ? AND target_type = 'AUTHORIZATION'",
      [ruleValue]
    )
  }

  for (const authorizer of authorizers) {
    if (mode === 'add') {
      await db.execute(
        "DELETE FROM notification_rules WHERE condition_plantel = ? AND target_type = 'AUTHORIZATION' AND LOWER(target_val) = ?",
        [ruleValue, authorizer.email]
      )
    }

    for (const channel of authorizer.channels) {
      await db.execute(
        'INSERT INTO notification_rules (condition_plantel, condition_puesto, target_type, target_val, channel) VALUES (?, ?, ?, ?, ?)',
        [ruleValue, employee.name, 'AUTHORIZATION', authorizer.email, channel]
      )
    }
  }

  return {
    success: true,
    employeeName: employee.name,
    authorizers: authorizers.length
  }
})
