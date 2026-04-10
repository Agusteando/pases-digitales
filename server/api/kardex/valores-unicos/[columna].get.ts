
import { defineEventHandler, getRouterParam } from '#imports'

export default defineEventHandler(async (event) => {
  const col = getRouterParam(event, 'columna')
  if (!col) return { valores: [] }
  try {
    const data = await $fetch(`https://kardex.casitaapps.com/api/kardex/valores-unicos/${col}`)
    return data || { valores: [] }
  } catch (err) {
    return { valores: [] }
  }
})