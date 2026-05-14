import { useDB } from '~/server/utils/db'
import { dispatchNotificationsForPass } from '~/server/utils/notifications'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.log_id) throw createError({ statusCode: 400, message: 'Falta el identificador del registro a reintentar.' })

  const db = useDB()

  try {
    const [logRows]: any = await db.execute('SELECT * FROM notification_logs WHERE id = ?', [body.log_id])
    if (!logRows.length) return { success: false }

    const log = logRows[0]
    const [passRows]: any = await db.execute('SELECT id FROM hr_entries WHERE id = ?', [log.pass_id])
    if (!passRows.length) return { success: false }

    const success = await dispatchNotificationsForPass(Number(log.pass_id), { scheduleTg: false })
    if (!success) throw createError({ statusCode: 500, message: 'No fue posible ejecutar el motor de autorizaciones.' })

    await db.execute(
      `UPDATE notification_logs
       SET error_text = CONCAT(COALESCE(error_text, ''), ' | Reintento delegado al motor de destinatarios autorizados')
       WHERE id = ?`,
      [log.id]
    )

    return { success: true }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Error en el reintento seguro de notificación.' })
  }
})
