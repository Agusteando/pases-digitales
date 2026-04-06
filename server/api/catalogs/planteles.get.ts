import { getFastSoapEmployees, cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // CRITICAL RULE: Must use ONLY SOAP-resolved planteles as the authoritative source.
  // The Signia Options API fallback has been permanently removed to guarantee that
  // the planteles listed in 'Configurar Notificaciones' perfectly match the exact strings 
  // saved by the onboarding modal and pase generation.
  const data = await getFastSoapEmployees()
  const planteles = new Set<string>()
  
  data.forEach(e => {
    const cleaned = cleanPlantelName(e.plantel)
    if (cleaned && cleaned !== 'N/A') {
      planteles.add(cleaned)
    }
  })
  
  const sortedPlanteles = Array.from(planteles).sort()
  return sortedPlanteles
})