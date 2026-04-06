import { getSigniaData } from '~/server/utils/employee-engine'
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

  // Graceful fallback: extract from authoritative employees list
  const data = await getSigniaData()
  const planteles = new Set<string>()
  
  data.forEach(e => {
    if (e.plantelName && typeof e.plantelName === 'string') {
      planteles.add(e.plantelName.trim())
    }
  })
  
  const sortedPlanteles = Array.from(planteles).sort()
  return sortedPlanteles
})