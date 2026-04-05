import { useDB } from '~/server/utils/db'
import { sendWhatsAppMessage, buildWhatsAppTemplate } from '~/server/utils/whatsappModule'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.log_id) throw createError({ statusCode: 400, message: 'Falta ID de log' })

  const db = useDB()
  
  try {
    const [logRows]: any = await db.execute(`SELECT * FROM notification_logs WHERE id = ?`, [body.log_id])
    if (!logRows.length) return { success: false }
    const log = logRows[0]
    
    const [passRows]: any = await db.execute(`SELECT * FROM hr_entries WHERE id = ?`, [log.pass_id])
    if (!passRows.length) return { success: false }
    const pass = passRows[0]
    
    const messageStr = buildWhatsAppTemplate({
      id: pass.id, employeeName: pass.employee_name, plantel: pass.plantel, 
      categoryId: pass.category_id, date: pass.date?.toISOString().split('T')[0], 
      time: pass.time, comentarios: pass.comentarios, user: pass.user
    }, pass.status === 'cancelado')

    try {
      const response = await sendWhatsAppMessage({ chatId: log.chat_id, message: messageStr })
      const wmsgId = response?.messageId || response?.id || 'retry-ok'
      await db.execute(`UPDATE notification_logs SET status = 'sent', message_id = ?, error_text = NULL WHERE id = ?`, [wmsgId, log.id])
      return { success: true }
    } catch (apiErr: any) {
      await db.execute(`UPDATE notification_logs SET status = 'failed', error_text = ? WHERE id = ?`, [apiErr.message || 'Error Desconocido', log.id])
      throw createError({ statusCode: 500, message: 'Fallo al reintentar envío' })
    }
  } catch (error) {
    throw createError({ statusCode: 500, message: "Error interno del motor de notificaciones." })
  }
})