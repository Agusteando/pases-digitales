import { getFastSoapEmployees, getSigniaEnrichment, cleanPlantelName } from '~/server/utils/employee-engine'
import { defineCachedEventHandler, getQuery } from '#imports'

// defineCachedEventHandler envuelve el endpoint en el Caché de Vercel (Edge Cache).
// Las peticiones repetidas para el mismo ID/Nombre no ejecutarán código, respondiendo en milisegundos con costo de cómputo $0.
export default defineCachedEventHandler(async (event) => {
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
}, {
  maxAge: 60 * 60 * 12, // Caché dura 12 horas en el CDN de Vercel
  swr: true, // Stale-While-Revalidate: Devuelve caché rápido y actualiza en background sin bloquear al usuario
  name: 'enrichment-cache',
  getKey: (event) => {
    const q = getQuery(event)
    return `${q.id || 'noid'}-${q.name || 'noname'}`
  }
})