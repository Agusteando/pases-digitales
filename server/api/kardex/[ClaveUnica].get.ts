import { defineEventHandler, getRouterParam } from '#imports'

export default defineEventHandler(async (event) => {
  const ClaveUnica = getRouterParam(event, 'ClaveUnica')
  if (!ClaveUnica) return []
  try {
    const data = await $fetch(`https://kardex.casitaapps.com/api/kardex/nomina/${ClaveUnica}`)
    return data || []
  } catch (err) {
    return []
  }
})