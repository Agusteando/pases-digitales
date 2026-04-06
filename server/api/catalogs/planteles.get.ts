import { getInternalEmployeeList } from '~/server/utils/employee-engine'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  // Proven technique: derive the catalog directly from the real, enriched employee dataset
  const data = await getInternalEmployeeList()
  const planteles = new Set<string>()
  
  data.forEach(e => {
    if (e.plantel && typeof e.plantel === 'string' && e.plantel.trim() !== '') {
      planteles.add(e.plantel.trim())
    }
  })
  
  const sortedPlanteles = Array.from(planteles).sort()
  
  // Fallback to the standard known structure if the dataset is momentarily empty or unreachable,
  // guaranteeing the UI never breaks or presents an empty operational map.
  if (sortedPlanteles.length === 0) {
    return [
      'CM', 'CO', 'CT', 'DCA', 'DM', 'ISSSTE MET', 'ISSSTE TOL', 'KM', 'KT', 'PM', 'PREES MET', 'PREES TOL', 'PT', 'SM', 'ST', 'U-0837'
    ].sort()
  }
  
  return sortedPlanteles
})