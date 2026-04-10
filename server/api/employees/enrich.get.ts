
import { getFastSoapEmployees, getSigniaEnrichment, cleanPlantelName } from '~/server/utils/employee-engine'
import { defineCachedEventHandler, getQuery } from '#imports'

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  const name = query.name as string

  const hasId = id && id !== 'undefined' && id !== 'null';
  const hasName = !hasId && name && name !== 'undefined' && name !== 'null';

  if (!hasId && !hasName) return {}

  const dataset = await getFastSoapEmployees()
  
  const empMatch = dataset.find(e => 
    (hasId && String(e.id) === String(id)) || 
    (hasName && e.name === name)
  )

  const localRfc: string | undefined = empMatch?.rfc
  const localCurp: string | undefined = empMatch?.curp
  const localIngressio: string | undefined = empMatch?.ingressioId

  const searchName = empMatch ? empMatch.name : (hasName ? name : '');
  const enriched = await getSigniaEnrichment(searchName, localRfc, localCurp, localIngressio)

  const soapPlantel = cleanPlantelName(empMatch?.plantel)
  const finalPlantel = soapPlantel || enriched.plantelName || null

  return {
    picture: enriched.picture || null,
    puesto: enriched.puesto || null,
    email: enriched.email || empMatch?.email || null,
    plantel: finalPlantel,
    isActive: enriched.isActive !== false,
    curp: enriched.curp || empMatch?.curp || null,
    numero_nomina: localIngressio || enriched.ingressioId || null
  }
}, {
  maxAge: 60 * 60 * 12,
  swr: true,
  name: 'enrichment-cache',
  getKey: (event) => {
    const q = getQuery(event)
    const hasId = q.id && q.id !== 'undefined' && q.id !== 'null';
    if (hasId) return `enrichment-id-${q.id}`
    return `enrichment-name-${q.name || 'noname'}`
  }
})