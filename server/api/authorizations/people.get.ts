import { defineEventHandler, getQuery } from '#imports'
import { requireAdmin } from '~/server/utils/access'
import { getFastSoapEmployees, normalizeName } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = String(getQuery(event).q || '').trim()
  if (q.length < 2) return []

  const normalized = normalizeName(q)
  const raw = q.toLowerCase()
  const employees = await getFastSoapEmployees()

  return employees
    .filter((employee: any) => {
      return normalizeName(employee.name).includes(normalized) ||
        String(employee.email || '').toLowerCase().includes(raw) ||
        String(employee.curp || '').toLowerCase().includes(raw)
    })
    .slice(0, 20)
    .map((employee: any) => ({
      name: employee.name,
      email: employee.email,
      curp: employee.curp,
      plantel: employee.plantel,
      ClaveUnica: employee.ClaveUnica
    }))
})
