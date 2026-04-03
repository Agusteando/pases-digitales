import { searchEmployees } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const plantel = query.plantel as string | undefined

  if (!q) {
    return []
  }
  
  return await searchEmployees(q, plantel)
})