

import { useDB } from '~/server/utils/db'
import { sendWhatsAppMessage } from '~/server/utils/whatsappModule'
import { sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { signRecipientToken } from '~/server/utils/token'
import { defineEventHandler, readBody, createError, useRuntimeConfig } from '#imports'

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

    const rToken = signRecipientToken(log.chat_id, targetName)
    const targetAuthUrl = `${config.appUrl}/authorize/${pass.auth_token}?r=${rToken}`

    const isAuthorized = pass.status === 'autorizado'
    const isRejected = pass.status === 'rechazado'
    const isCancelled = pass.status === 'cancelado'

    const categories: Record<number, string> = {
      1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
    }
    const categoryName = categories[pass.category_id] || 'Pase'
    const paddedId = String(pass.id).padStart(5, '0')
    const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    const returnMessage = pass.hora_regreso ? ` Se espera su regreso al plantel a las ${pass.hora_regreso}.` : ''
    const tipoPermisoMsg = pass.tipo_permiso ? `\nTipo de permiso: ${pass.tipo_permiso}` : ''
    const motivoMsg = pass.comentarios ? ` con motivo: ${pass.comentarios}` : ''
    const timeMsg = pass.time ? ` - Hora: ${pass.time}` : ''

    const isCambioHorario = pass.category_id === 4;
    const cambioHorarioMsg = isCambioHorario && pass.horario_entrada && pass.horario_salida 
      ? `\n⏰ *Nuevo Horario:* ${pass.horario_entrada} a ${pass.horario_salida}` 
      : '';
    const endDateFormatted = pass.fecha_fin ? new Date(pass.fecha_fin).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const dateRangeMsg = isCambioHorario 
      ? `Vigencia: ${formattedDate} al ${endDateFormatted || formattedDate}` 
      : `Fecha: ${formattedDate}`;

    let headerTitle = `*Solicitud de Autorización (Recordatorio)* ⚠️`
    let actionPhrase = `tienes esta solicitud pendiente de autorización. Por favor, revísala y resuélvela mediante este enlace seguro:`
    let emailSubject = `Recordatorio: Solicitud #${paddedId} requiere atención`
    let emailTitle = `Solicitud de Autorización (Recordatorio)`
    let emailActionBtn = `Revisar y Resolver Solicitud`

    if (isAuthorized) {
      headerTitle = `*Pase Autorizado (Recordatorio)* ✅`
      actionPhrase = `esta solicitud ya fue autorizada por ${pass.authorized_by}. Puedes consultar el registro aquí:`
      emailSubject = `Recordatorio: Pase Autorizado #${paddedId}`
      emailTitle = `Pase Autorizado (Recordatorio)`
      emailActionBtn = `Ver Expediente`
    } else if (isRejected) {
      headerTitle = `*Pase Rechazado (Recordatorio)* ❌`
      actionPhrase = `esta solicitud ha sido rechazada por ${pass.authorized_by}. Puedes consultar los detalles en el siguiente enlace:`
      emailSubject = `Recordatorio: Pase Rechazado #${paddedId}`
      emailTitle = `Pase Rechazado (Recordatorio)`
      emailActionBtn = `Ver Expediente`
    } else if (isCancelled) {
      headerTitle = `*Pase Anulado (Recordatorio)* 🚫`
      actionPhrase = `esta solicitud ha sido anulada. Puedes verificarlo aquí:`
      emailSubject = `Recordatorio: Pase Anulado #${paddedId}`
      emailTitle = `Pase Anulado (Recordatorio)`
      emailActionBtn = `Ver Expediente`
    }

    if (isWhatsApp) {
      const waMessage = `${headerTitle}\n\n${categoryName} para *${pass.employee_name}*${tipoPermisoMsg}${cambioHorarioMsg}${motivoMsg}${returnMessage}\n${dateRangeMsg}${timeMsg && !isCambioHorario ? timeMsg : ''} - Folio *${paddedId}*\n\nHola ${targetName.split(' ')[0]}, ${actionPhrase}\n${targetAuthUrl}`

      try {
        const response = await sendWhatsAppMessage({ chatId: log.chat_id, message: waMessage })
        const wmsgId = response?.messageId || response?.id || 'retry-ok'
        await db.execute(
          `UPDATE notification_logs SET status = 'sent', message_id = ?, error_text = REPLACE(error_text, ' | Error:', ' | Reintentado OK:') WHERE id = ?`, 
          [wmsgId, log.id]
        )
        return { success: true }
      } catch (apiErr: any) {
        throw createError({ statusCode: 500, message: 'Error interno al intentar enviar el mensaje por WhatsApp.' })
      }
    } 
    
    if (isEmail) {
      const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-w: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
           <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800;">${emailTitle}</h1>
           <p style="margin: 0 0 32px; color: #64748b; font-size: 15px;">Folio <strong>#${paddedId}</strong> &bull; ${categoryName}</p>
           
           <div style="text-align: left; background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Colaborador:</strong><br><span style="color: #0f172a; font-size: 16px; font-weight: 600;">${pass.employee_name}</span></p>
              ${isCambioHorario ? `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Vigencia:</strong><br><span style="color: #0f172a; font-weight: 600;">Del ${formattedDate} al ${endDateFormatted || formattedDate}</span></p>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Nuevo Horario:</strong><br><span style="color: #0f172a; font-weight: 600;">${pass.horario_entrada} a ${pass.horario_salida}</span></p>` : `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Fecha y Hora:</strong><br><span style="color: #0f172a; font-weight: 600;">${formattedDate} ${pass.time ? 'a las ' + pass.time : ''}</span></p>`}
              ${pass.tipo_permiso ? `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Tipo de Permiso:</strong><br><span style="color: #0f172a;">${pass.tipo_permiso}</span></p>` : ''}
              ${pass.comentarios ? `<p style="margin: 0; color: #334155; font-size: 14px;"><strong>Motivo:</strong><br><span style="color: #0f172a;">${pass.comentarios}</span></p>` : ''}
              ${(isAuthorized || isRejected) && pass.authorized_by ? `<p style="margin: 12px 0 0; color: ${isAuthorized ? '#059669' : '#dc2626'}; font-size: 14px;"><strong>${isAuthorized ? 'Autorizado' : 'Rechazado'} por:</strong><br><span style="color: ${isAuthorized ? '#064e3b' : '#991b1b'}; font-weight: 600;">${pass.authorized_by}</span></p>` : ''}
           </div>

           <a href="${targetAuthUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px;">${emailActionBtn}</a>
        </div>
      </div>`
      try {
        await sendWorkspaceEmail(log.chat_id, emailSubject, emailHtml)
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