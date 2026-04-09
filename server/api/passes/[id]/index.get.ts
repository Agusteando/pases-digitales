import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getRouterParam, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  // Strict check to completely reject ghost requests created by component teardown logic in frontend
  if (!id || id === 'undefined' || id === 'null') {
    throw createError({ statusCode: 400, message: 'ID de registro inválido o no proporcionado.' })
  }

  const db = useDB()

  try {
    // Retain full wildcard retrieval mapping since the specific ID restricts the payload cleanly 
    const [passRows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [id])
    if (!passRows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })

    const pass = passRows[0]

    const [logRows]: any = await db.execute('SELECT chat_id, status, error_text, created_at FROM notification_logs WHERE pass_id = ? ORDER BY id DESC', [id])

    return {
      ...pass,
      plantel: cleanPlantelName(pass.plantel),
      notifications: logRows
    }
  } catch (error: any) {
    console.error('Fetch pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar la información del registro.' })
  }
})