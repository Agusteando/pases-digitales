import { defineEventHandler, getQuery, createError } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const params = new URLSearchParams()
    
    // Pasar el parámetro de inyección de fecha atípica si se proporciona
    if (query.ultima_fecha_corte) {
      params.append('ultima_fecha_corte', String(query.ultima_fecha_corte))
    }

    const url = `https://kardex.casitaapps.com/api/periodos${params.toString() ? '?' + params.toString() : ''}`
    
    // Al realizar la petición desde el lado del servidor (Node.js/Vercel)
    // omitimos por completo las restricciones de CORS del navegador y
    // permitimos la inyección dinámica de parámetros sin exponer endpoints externos.
    const data = await $fetch(url)
    return data || null
  } catch (error) {
    console.error('Error fetching periodos from Kardex:', error)
    throw createError({ statusCode: 502, message: 'Fallo de conectividad al recuperar los periodos de nómina.' })
  }
})