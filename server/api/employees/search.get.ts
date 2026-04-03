import { searchEmployees } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  const { q, plantel } = getQuery(event)
  if (!q) return []
  return await searchEmployees(q as string, plantel as string)
})