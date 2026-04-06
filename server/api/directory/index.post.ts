import { useDB } from '~/server/utils/db'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plantel, email, role } = body
  
  if (!plantel || !email || !role) {
    throw createError({ statusCode: 400, message: 'Datos incompletos. Faltan campos requeridos.' })
  }

  const db = useDB()
  
  try {
    await db.execute(
      'INSERT INTO hr_directory (plantel, email, role, puesto) VALUES (?, ?, ?, NULL)', 
      [plantel, email, role]
    )
    return { success: true }
  } catch (error: any) {
    console.error('Directory insert error:', error.message || error)
    
    // Provide a more descriptive error if a network drop happens despite keep-alive
    if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      throw createError({ statusCode: 503, message: 'Conexión a la base de datos interrumpida. Por favor, reintenta.' })
    }
    
    throw createError({ statusCode: 500, message: 'No se pudo registrar el contacto en la base de datos.' })
  }
})