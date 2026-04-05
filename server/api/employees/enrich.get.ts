import { getInternalEmployeeList, getSigniaEnrichment } from '~/server/utils/employee-engine'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  const name = query.name as string

  if (!id && !name) return {}

  const dataset = await getInternalEmployeeList()
  const empMatch = dataset.find(e => e.id === id || e.name === name)

  let localRfc: string | undefined = empMatch?.rfc
  let localCurp: string | undefined = empMatch?.curp

  const enriched = await getSigniaEnrichment(name, localRfc, localCurp)

  return {
    picture: enriched.picture || null,
    puesto: enriched.puesto || null,
    email: enriched.email || empMatch?.email || null,
    plantelId: enriched.plantelId || empMatch?.plantel || null,
    isActive: enriched.isActive !== false,
    curp: enriched.curp || empMatch?.curp || null
  }
})