import { getSigniaData } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // Use authoritative options API to avoid rebuilding the catalog manually
  try {
    const options: any = await $fetch('https://signia.casitaapps.com/api/options', { timeout: 5000 })
    if (options && Array.isArray(options.puestos)) {
      return options.puestos.map((p: any) => p.name || p.label || p).filter(Boolean).sort()
    }
  } catch (e) {
    console.warn('Options API fallback engaged for puestos')
  }

  // Graceful fallback: extract from authoritative employees list
  const data = await getSigniaData()
  const puestos = new Set<string>()
  
  data.forEach(e => {
    if (e.puesto && e.puesto.trim() !== '') {
      puestos.add(e.puesto.trim())
    }
  })
  
  return Array.from(puestos).sort()
})