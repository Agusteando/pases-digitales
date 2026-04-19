import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(async () => {
  try {
    // Al realizar la petición desde el lado del servidor (Node.js/Vercel)
    // omitimos por completo las restricciones de CORS del navegador.
    const data = await $fetch('https://kardex.casitaapps.com/api/periodos')
    return data || null
  } catch (error) {
    console.error('Error fetching periodos from Kardex:', error)
    throw createError({ statusCode: 502, message: 'Fallo de conectividad al recuperar los periodos de nómina.' })
  }
})