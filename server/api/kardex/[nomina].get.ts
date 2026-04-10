
import { defineEventHandler, getRouterParam } from '#imports'

export default defineEventHandler(async (event) => {
  const nomina = getRouterParam(event, 'nomina')
  if (!nomina) return []
  try {
    const data = await $fetch(`https://kardex.casitaapps.com/api/kardex/nomina/${nomina}`)
    return data || []
  } catch (err) {
    return []
  }
})