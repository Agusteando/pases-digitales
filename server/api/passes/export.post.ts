import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.plantel || !body.startDate || !body.endDate) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos para la exportación.' })
  }

  try {
    // Proxy request to the legacy API that generates the Excel base64
    const response = await $fetch<string>('https://api.casitaiedis.edu.mx/exportToExcel', {
      method: 'POST',
      body: {
        plantel: body.plantel,
        startDate: body.startDate,
        endDate: body.endDate
      }
    })

    return { base64: response }
  } catch (error) {
    console.error('Export proxy error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al procesar la exportación del reporte.' })
  }
})