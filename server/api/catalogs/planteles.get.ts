import { getFastSoapEmployees } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // Use authoritative options API to avoid rebuilding the catalog manually
  try {
    const options: any = await $fetch('https://signia.casitaapps.com/api/options', { timeout: 5000 })
    if (options && Array.isArray(options.planteles)) {
      return options.planteles.map((p: any) => p.name || p.label || p).filter(Boolean).sort()
    }
  } catch (e) {
    console.warn('Options API fallback engaged for planteles')
  }

  // Graceful fallback: extract from SOAP authoritative employees list
  const data = await getFastSoapEmployees()
  const planteles = new Set<string>()
  
  data.forEach(e => {
    if (e.plantel && typeof e.plantel === 'string') {
      planteles.add(e.plantel.trim())
    }
  })
  
  const sortedPlanteles = Array.from(planteles).sort()
  return sortedPlanteles
})