import { getFastSoapEmployees, getSigniaEnrichment } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  const name = query.name as string

  if (!id && !name) return {}

  // 1. Get identity baseline from SOAP to reliably retrieve RFC/CURP for matching
  const dataset = await getFastSoapEmployees()
  const empMatch = dataset.find(e => e.id === id || e.name === name)

  const localRfc: string | undefined = empMatch?.rfc
  const localCurp: string | undefined = empMatch?.curp

  // 2. Query Signia exclusively to fetch the real picture and correct operational status
  const enriched = await getSigniaEnrichment(name, localRfc, localCurp)

  return {
    picture: enriched.picture || null,
    puesto: enriched.puesto || null,
    email: enriched.email || empMatch?.email || null,
    plantel: enriched.plantelName || empMatch?.plantel || null, // Resolves authoritative clean plantel name exactly when needed
    isActive: enriched.isActive !== false,
    curp: enriched.curp || empMatch?.curp || null
  }
})