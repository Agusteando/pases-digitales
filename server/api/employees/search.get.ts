import { getFastSoapEmployees, normalizeName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  
  if (!q || q.length < 2) {
    return []
  }

  const searchName = normalizeName(q)
  const dataset = await getFastSoapEmployees()

  // Returns ONLY pure SOAP search/identity fields. 
  // 'id/ingressioId' and all Signia-related mock fields ('puesto') have been strictly removed.
  const results = dataset
    .filter(emp => normalizeName(emp.name).includes(searchName))
    .slice(0, 15)
    .map(emp => ({
      name: emp.name,
      plantel: emp.plantel,
      email: emp.email,
      curp: emp.curp,
      ClaveUnica: emp.ClaveUnica
    }))

  return results
})