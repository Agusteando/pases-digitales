import { getFastSoapEmployees } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const data = await getFastSoapEmployees()
  const planteles = new Set<string>()
  
  data.forEach(e => {
    if (e.plantel && typeof e.plantel === 'string' && e.plantel.trim() !== '') {
      planteles.add(e.plantel.trim())
    }
  })
  
  const sortedPlanteles = Array.from(planteles).sort()
  
  if (sortedPlanteles.length === 0) {
    return [
      'CM', 'CO', 'CT', 'DCA', 'DM', 'ISSSTE MET', 'ISSSTE TOL', 'KM', 'KT', 'PM', 'PREES MET', 'PREES TOL', 'PT', 'SM', 'ST'
    ].sort()
  }
  
  return sortedPlanteles
})