import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { action } = body // 'resend', 'authorize', 'cancel'
  
  if (!id || !action) {
    throw createError({ statusCode: 400, message: 'Missing ID or Action' })
  }

  const db = useDB()

  try {
    if (action === 'resend') {
      // In a real environment, trigger email/SOAP webhook here.
      // For DB, we could update `sync_request` to force a re-sync
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true, message: 'Notificación re-encolada con éxito.' }
    } 
    
    if (action === 'authorize') {
      await db.execute(`UPDATE hr_entries SET status = 'autorizado' WHERE id = ?`, [id])
      return { success: true, message: 'Pase autorizado.' }
    }
    
    if (action === 'cancel') {
      await db.execute(`UPDATE hr_entries SET status = 'cancelado' WHERE id = ?`, [id])
      return { success: true, message: 'Pase cancelado.' }
    }

    throw createError({ statusCode: 400, message: 'Invalid Action' })

  } catch (error) {
    console.error("Action handler error:", error)
    throw createError({ statusCode: 500, message: 'Database operation failed.' })
  }
})