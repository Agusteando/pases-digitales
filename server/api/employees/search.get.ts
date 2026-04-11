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

  // Returns ONLY search/identity fields. `picture` is strictly omitted from this layer.
  // We guarantee ingressioId (ClaveNomina) is returned here for Kardex operations.
  const results = dataset
    .filter(emp => normalizeName(emp.name).includes(searchName))
    .slice(0, 15)
    .map(emp => ({
      id: emp.id,
      name: emp.name,
      plantel: emp.plantel,
      email: emp.email,
      puesto: emp.puesto,
      curp: emp.curp,
      ingressioId: emp.ingressioId
    }))

  return results
})