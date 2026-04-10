
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(query)) {
    if (val !== undefined && val !== null && val !== '') {
      params.append(key, String(val))
    }
  }
  
  try {
    const data = await $fetch(`https://kardex.casitaapps.com/api/kardex?${params.toString()}`)
    return data || []
  } catch (err) {
    return []
  }
})