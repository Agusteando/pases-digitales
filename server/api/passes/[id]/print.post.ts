import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, createError, setResponseHeader } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID de pase no válido.' })

  const db = useDB()

  try {
    const [rows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no localizado en la base de datos.' })

    const pass = rows[0]

    const categories: Record<number, string> = {
      1: 'Pase de entrada',
      2: 'Pase de salida',
      3: 'Pase para faltar',
      4: 'Pase cambio de horario',
      5: 'Incapacidad'
    }
    
    pass.category_name = categories[pass.category_id] || 'Desconocido'

    // Fetch the PDF format from the legacy bot system
    const pdfBuffer = await $fetch<ArrayBuffer>('https://bot.casitaapps.com/formato', {
      method: 'POST',
      body: pass,
      responseType: 'arrayBuffer'
    })

    setResponseHeader(event, 'Content-Type', 'application/pdf')
    setResponseHeader(event, 'Content-Disposition', `inline; filename="Pase_Digital_${String(id).padStart(5, '0')}.pdf"`)

    return pdfBuffer
  } catch (error) {
    console.error('PDF Generation Proxy Error:', error)
    throw createError({ statusCode: 500, message: 'Ocurrió un error en el servidor de generación de formatos.' })
  }
})