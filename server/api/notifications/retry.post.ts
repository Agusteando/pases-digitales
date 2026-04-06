import { useDB } from '~/server/utils/db'
import { sendWhatsAppMessage, buildWhatsAppTemplate } from '~/server/utils/whatsappModule'
import { sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { defineEventHandler, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.log_id) throw createError({ statusCode: 400, message: 'Falta ID de registro' })

  const db = useDB()
  
  try {
    const [logRows]: any = await db.execute(`SELECT * FROM notification_logs WHERE id = ?`, [body.log_id])
    if (!logRows.length) return { success: false }
    const log = logRows[0]
    
    const [passRows]: any = await db.execute(`SELECT * FROM hr_entries WHERE id = ?`, [log.pass_id])
    if (!passRows.length) return { success: false }
    const pass = passRows[0]

    const errorText = log.error_text || ''
    const isWhatsApp = errorText.includes('Canal: WhatsApp')
    const isEmail = errorText.includes('Canal: Email')

    if (isWhatsApp) {
      const messageStr = buildWhatsAppTemplate({
        id: pass.id, employeeName: pass.employee_name, plantel: pass.plantel, 
        categoryId: pass.category_id, date: pass.date?.toISOString().split('T')[0], 
        time: pass.time, comentarios: pass.comentarios, user: pass.user
      }, pass.status === 'cancelado')

      try {
        const response = await sendWhatsAppMessage({ chatId: log.chat_id, message: messageStr })
        const wmsgId = response?.messageId || response?.id || 'retry-ok'
        await db.execute(
          `UPDATE notification_logs SET status = 'sent', message_id = ?, error_text = REPLACE(error_text, ' | Error:', ' | Reintentado OK:') WHERE id = ?`, 
          [wmsgId, log.id]
        )
        return { success: true }
      } catch (apiErr: any) {
        throw createError({ statusCode: 500, message: 'Fallo al reintentar envío por WhatsApp' })
      }
    } 
    
    if (isEmail) {
      // Re-triggering standard auth email logic manually for retries
      const emailHtml = `
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2>Reintento de Notificación de Pase #${pass.id}</h2>
        <p>Por favor revise el panel operativo para atender la solicitud de ${pass.employee_name}.</p>
      </div>`
      try {
        await sendWorkspaceEmail(log.chat_id, `Recordatorio: Pase #${pass.id} requiere atención`, emailHtml)
        await db.execute(
          `UPDATE notification_logs SET status = 'sent', error_text = REPLACE(error_text, ' | Error:', ' | Reintentado OK:') WHERE id = ?`, 
          [log.id]
        )
        return { success: true }
      } catch (err) {
        throw createError({ statusCode: 500, message: 'Fallo al reintentar envío por Correo' })
      }
    }

    throw createError({ statusCode: 400, message: 'No se reconoce el canal de entrega para el reintento.' })
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message || "Error interno del motor de notificaciones." })
  }
})