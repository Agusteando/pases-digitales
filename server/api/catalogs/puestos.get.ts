import { getFastSoapEmployees } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // CRITICAL RULE: Must use ONLY SOAP-resolved datasets to ensure alignment 
  // across the routing and notification engine. Signia API fallback removed.
  const data = await getFastSoapEmployees()
  const puestos = new Set<string>()
  
  data.forEach(e => {
    if (e.puesto && e.puesto.trim() !== '') {
      puestos.add(e.puesto.trim())
    }
  })
  
  return Array.from(puestos).sort()
})