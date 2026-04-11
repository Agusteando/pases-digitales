import { defineEventHandler } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const data = await $fetch('https://kardex.casitaapps.com/api/estado')
    return data || {}
  } catch (err) {
    return { error: true, status: 'unknown' }
  }
})