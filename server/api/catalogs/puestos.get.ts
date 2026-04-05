import { getSigniaData } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const data = await getSigniaData()
  const puestos = new Set<string>()
  
  data.forEach(e => {
    if (e.puesto && e.puesto.trim() !== '') {
      puestos.add(e.puesto.trim())
    }
  })
  
  return Array.from(puestos).sort()
})