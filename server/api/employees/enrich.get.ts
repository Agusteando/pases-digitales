import { getFastSoapEmployees, getSigniaEnrichment, cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  const name = query.name as string

  const hasId = id && id !== 'undefined' && id !== 'null';
  const hasName = name && name !== 'undefined' && name !== 'null';

  if (!hasId && !hasName) return {}

  // 1. Get identity baseline from SOAP to reliably retrieve RFC/CURP/ClaveNomina for matching
  const dataset = await getFastSoapEmployees()
  
  // Find the exact match safely, avoiding "undefined" string coercions
  const empMatch = dataset.find(e => 
    (hasId && String(e.id) === String(id)) || 
    (hasName && e.name === name)
  )

  const localRfc: string | undefined = empMatch?.rfc
  const localCurp: string | undefined = empMatch?.curp
  const localIngressio: string | undefined = empMatch?.ingressioId

  // 2. Query Signia exclusively to fetch the real picture and correct operational status
  const enriched = await getSigniaEnrichment(name, localRfc, localCurp, localIngressio)

  // Explicit priority given to SOAP-resolved plantel for all routing purposes
  const soapPlantel = cleanPlantelName(empMatch?.plantel)
  const finalPlantel = soapPlantel || enriched.plantelName || null

  return {
    picture: enriched.picture || null,
    puesto: enriched.puesto || null,
    email: enriched.email || empMatch?.email || null,
    plantel: finalPlantel,
    isActive: enriched.isActive !== false,
    curp: enriched.curp || empMatch?.curp || null
  }
})