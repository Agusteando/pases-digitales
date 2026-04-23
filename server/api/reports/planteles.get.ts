import { getSigniaData } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const data = await getSigniaData()
  const planteles = new Set<string>()
  
  if (Array.isArray(data)) {
    data.forEach((e: any) => {
      if (e && e.plantel && e.plantel.name && typeof e.plantel.name === 'string') {
        const name = e.plantel.name.trim().toUpperCase()
        if (name) {
          planteles.add(name)
        }
      }
    })
  }
  
  return Array.from(planteles).sort()
})