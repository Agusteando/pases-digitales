import { getInternalEmployeeList, normalizeName } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  
  if (!q || q.length < 2) {
    return []
  }

  const searchName = normalizeName(q)
  const dataset = await getInternalEmployeeList()

  const results = dataset
    .filter(emp => normalizeName(emp.name).includes(searchName))
    .slice(0, 15)
    .map(emp => ({
      id: emp.id,
      name: emp.name,
      plantel: emp.plantel,
      email: emp.email
    }))

  return results
})