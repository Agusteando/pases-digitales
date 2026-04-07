import { getSigniaData } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // CRITICAL FIX: The UI needs the full actual list of hierarchical Puestos to build 
  // accurate rules. We fetch directly from the Signia enrichment source to guarantee 
  // that every valid Puesto name is fully populated and available to select.
  const data = await getSigniaData()
  const puestos = new Set<string>()
  
  data.forEach(e => {
    if (e.puesto && e.puesto.trim() !== '') {
      puestos.add(e.puesto.trim())
    }
  })
  
  return Array.from(puestos).sort()
})