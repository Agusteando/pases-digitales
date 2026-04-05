import { useDB } from '~/server/utils/db'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { plantel, email, role, puesto } = body
  
  if (!plantel || !email || !role) {
    throw createError({ statusCode: 400, message: 'Datos incompletos. Faltan campos requeridos.' })
  }

  const db = useDB()
  
  try {
    await db.execute(
      'INSERT INTO hr_directory (plantel, email, role, puesto) VALUES (?, ?, ?, ?)', 
      [plantel, email, role, puesto || null]
    )
    return { success: true }
  } catch (error) {
    console.error('Directory insert error:', error)
    throw createError({ statusCode: 500, message: 'No se pudo registrar el contacto.' })
  }
})