import { useDB } from '~/server/utils/db'
import { sendWhatsAppMessage } from '~/server/utils/whatsappModule'
import { sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { defineEventHandler, readBody, createError, useRuntimeConfig } from '#imports'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body.log_id) throw createError({ statusCode: 400, message: 'Falta el identificador del registro a reintentar.' })

  const db = useDB()
  const config = useRuntimeConfig()
  
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

    const targetName = errorText.match(/Destinatario:\s*([^|]+)/)?.[1]?.trim() || 'Responsable'

    // Mandatory behavior: The usable authorization link must be sent exactly as in the original send.
    const rToken = jwt.sign(
      { passId: pass.id, email: log.chat_id, name: targetName },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    const targetAuthUrl = `${config.appUrl}/authorize/${pass.auth_token}?r=${rToken}`

    const categories: Record<number, string> = {
      1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
    }
    const categoryName = categories[pass.category_id] || 'Pase'
    const paddedId = String(pass.id).padStart(5, '0')
    const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    const returnMessage = pass.hora_regreso ? ` Se espera su regreso al plantel a las ${pass.hora_regreso}.` : ''
    const motivoMsg = pass.comentarios ? ` con motivo ${pass.comentarios}` : ''
    const timeMsg = pass.time ? ` - Hora: - ${pass.time}` : ''

    if (isWhatsApp) {
      const waMessage = `*Solicitud de Autorización (Recordatorio)* ⚠️\n\n${categoryName} para *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate}${timeMsg} - Folio *${paddedId}*\n\nHola ${targetName.split(' ')[0]}, tienes esta solicitud pendiente de autorización. Por favor, revísala y resuélvela mediante este enlace seguro:\n${targetAuthUrl}`

      try {
        const response = await sendWhatsAppMessage({ chatId: log.chat_id, message: waMessage })
        const wmsgId = response?.messageId || response?.id || 'retry-ok'
        await db.execute(
          `UPDATE notification_logs SET status = 'sent', message_id = ?, error_text = REPLACE(error_text, ' | Error:', ' | Reintentado OK:') WHERE id = ?`, 
          [wmsgId, log.id]
        )
        return { success: true }
      } catch (apiErr: any) {
        throw createError({ statusCode: 500, message: 'Error interno al intentar enviar el mensaje de resguardo por WhatsApp.' })
      }
    } 
    
    if (isEmail) {
      const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-w: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
           <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800;">Solicitud de Autorización (Recordatorio)</h1>
           <p style="margin: 0 0 32px; color: #64748b; font-size: 15px;">Folio <strong>#${paddedId}</strong> &bull; ${categoryName}</p>
           
           <div style="text-align: left; background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Colaborador:</strong><br><span style="color: #0f172a; font-size: 16px; font-weight: 600;">${pass.employee_name}</span></p>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Fecha y Hora:</strong><br><span style="color: #0f172a; font-weight: 600;">${formattedDate} ${pass.time ? 'a las ' + pass.time : ''}</span></p>
              ${pass.comentarios ? `<p style="margin: 0; color: #334155; font-size: 14px;"><strong>Motivo:</strong><br><span style="color: #0f172a;">${pass.comentarios}</span></p>` : ''}
           </div>

           <a href="${targetAuthUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px;">Revisar y Resolver Solicitud</a>
        </div>
      </div>`
      try {
        await sendWorkspaceEmail(log.chat_id, `Recordatorio: Solicitud #${paddedId} requiere atención`, emailHtml)
        await db.execute(
          `UPDATE notification_logs SET status = 'sent', error_text = REPLACE(error_text, ' | Error:', ' | Reintentado OK:') WHERE id = ?`, 
          [log.id]
        )
        return { success: true }
      } catch (err) {
        throw createError({ statusCode: 500, message: 'Fallo al reintentar el envío mediante el servidor de Correo Electrónico.' })
      }
    }

    throw createError({ statusCode: 400, message: 'No es posible identificar la naturaleza del canal original de entrega para ejecutar el reintento.' })
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, message: error.message || "Error irrecuperable en el motor interno de notificaciones." })
  }
})