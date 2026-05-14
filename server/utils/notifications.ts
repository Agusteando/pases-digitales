import { useDB } from '~/server/utils/db'
import { sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { sendWhatsAppMessage } from '~/server/utils/whatsappModule'
import { signRecipientToken } from '~/server/utils/token'
import { resolveAuthorizationForPass, logAuthorizationDebug, type AuthorizationTarget } from '~/server/utils/authorizationRules'
import { useRuntimeConfig } from '#imports'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const toWhatsAppChatId = (phone: string) => {
  if (!phone) return ''
  if (phone.includes('@')) return phone
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = `521${cleaned}`
  return cleaned ? `${cleaned}@c.us` : ''
}

const getPassCopy = (pass: any) => {
  const categories: Record<number, string> = {
    1: 'Pase de entrada',
    2: 'Pase de salida',
    3: 'Pase para faltar',
    4: 'Pase cambio de horario',
    5: 'Incapacidad'
  }

  const categoryName = categories[pass.category_id] || 'Pase'
  const paddedId = String(pass.id).padStart(5, '0')
  const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  const isCambioHorario = pass.category_id === 4
  const cambioHorarioMsg = isCambioHorario && pass.horario_entrada && pass.horario_salida
    ? `\n⏰ *Nuevo Horario:* ${pass.horario_entrada} a ${pass.horario_salida}`
    : ''
  const endDateFormatted = pass.fecha_fin ? new Date(pass.fecha_fin).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
  const dateRangeMsg = isCambioHorario
    ? `Vigencia: ${formattedDate} al ${endDateFormatted || formattedDate}`
    : `Fecha: ${formattedDate}`

  const tipoPermisoMsg = pass.tipo_permiso ? `\nTipo de permiso: ${pass.tipo_permiso}` : ''
  const motivoMsg = pass.comentarios ? ` con motivo: ${pass.comentarios}` : ''
  const returnMessage = pass.hora_regreso ? ` Se espera su regreso al plantel a las ${pass.hora_regreso}.` : ''
  const timeMsg = pass.time ? ` - Hora: ${pass.time}` : ''

  return {
    categoryName,
    paddedId,
    formattedDate,
    endDateFormatted,
    isCambioHorario,
    cambioHorarioMsg,
    dateRangeMsg,
    tipoPermisoMsg,
    motivoMsg,
    returnMessage,
    timeMsg
  }
}

async function logNotification(db: any, passId: number, chatId: string, status: string, text: string, messageId: string | null = null) {
  if (messageId) {
    await db.execute(
      'INSERT INTO notification_logs (pass_id, chat_id, status, message_id, error_text) VALUES (?, ?, ?, ?, ?)',
      [passId, chatId, status, messageId, text]
    )
    return
  }

  await db.execute(
    'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
    [passId, chatId, status, text]
  )
}

async function sendTelegramAudit(db: any, pass: any, options: { scheduleTg?: boolean }, copy: any) {
  const isAuthorized = pass.status === 'autorizado'
  const isRejected = pass.status === 'rechazado'
  const isCancelled = pass.status === 'cancelado'
  const telegramGlobalId = '-1003057962499'

  let statusIcon = '⚠️'
  let statusTitle = 'Pase Registrado'
  if (isAuthorized) { statusIcon = '✅'; statusTitle = 'Pase Autorizado' }
  else if (isRejected) { statusIcon = '❌'; statusTitle = 'Pase Rechazado' }
  else if (isCancelled) { statusIcon = '🚫'; statusTitle = 'Pase Anulado' }

  const tgMessage = `${statusIcon} ${statusTitle}\n${copy.categoryName} de *${pass.employee_name}*${copy.tipoPermisoMsg}${copy.cambioHorarioMsg}${copy.motivoMsg}${copy.returnMessage}\n${copy.dateRangeMsg}${copy.timeMsg && !copy.isCambioHorario ? copy.timeMsg : ''} - Folio *${copy.paddedId}*`

  let tgTriggerAt: string | undefined
  if (options.scheduleTg && isAuthorized) {
    const passDateStr = typeof pass.date === 'string' ? pass.date.substring(0, 10) : dayjs(pass.date).format('YYYY-MM-DD')
    let passTimeStr = pass.time ? String(pass.time).trim() : '08:00:00'
    if (copy.isCambioHorario && pass.horario_entrada) passTimeStr = String(pass.horario_entrada).trim()
    if (passTimeStr.length === 5) passTimeStr += ':00'

    const triggerDate = dayjs.tz(`${passDateStr}T${passTimeStr}`, 'America/Mexico_City')
    if (triggerDate.isValid() && triggerDate.isAfter(dayjs().tz('America/Mexico_City'))) {
      tgTriggerAt = triggerDate.toISOString()
    }
  }

  try {
    await $fetch('https://tgbot.casitaapps.com/sendMessages', {
      method: 'POST',
      body: {
        chatId: [telegramGlobalId],
        message: tgMessage,
        parse_mode: 'Markdown',
        disable_notification: false
      }
    })
    await logNotification(db, pass.id, telegramGlobalId, 'sent', `Sistema: Auditoría Global | Método: Telegram${tgTriggerAt ? ' (Inmediato)' : ''}`)
  } catch (e: any) {
    await logNotification(db, pass.id, telegramGlobalId, 'failed', `Sistema: Auditoría Global | Método: Telegram | Error: ${e.message || 'Fallo de red'}`)
  }

  if (tgTriggerAt) {
    const tgScheduledMessage = `⏰ *Recordatorio de Pase*\n${copy.categoryName} de *${pass.employee_name}*${copy.tipoPermisoMsg}${copy.cambioHorarioMsg}${copy.motivoMsg}${copy.returnMessage}\n${copy.dateRangeMsg}${copy.timeMsg && !copy.isCambioHorario ? copy.timeMsg : ''} - Folio *${copy.paddedId}*`

    try {
      await $fetch('https://tgbot.casitaapps.com/scheduleMessage', {
        method: 'POST',
        body: {
          chatId: [telegramGlobalId],
          message: tgScheduledMessage,
          triggerAt: tgTriggerAt,
          parse_mode: 'Markdown',
          disable_notification: false
        }
      })
      await logNotification(db, pass.id, telegramGlobalId, 'sent', `Sistema: Auditoría Global | Método: Telegram (Programado para ${dayjs(tgTriggerAt).format('DD/MM/YY HH:mm')})`)
    } catch (e: any) {
      await logNotification(db, pass.id, telegramGlobalId, 'failed', `Sistema: Auditoría Global | Método: Telegram (Programado) | Error: ${e.message || 'Fallo de red'}`)
    }
  }
}

function getNotificationLabels(pass: any, paddedId: string, isExclusive = false) {
  const isAuthorized = pass.status === 'autorizado'
  const isRejected = pass.status === 'rechazado'
  const isCancelled = pass.status === 'cancelado'

  if (isAuthorized) {
    return {
      headerTitle: '*Pase Autorizado* ✅',
      actionPhrase: `esta solicitud ya fue generada y autorizada por ${pass.authorized_by}. Puedes consultar el expediente digital en el siguiente enlace:`,
      emailTitle: 'Pase Autorizado',
      emailActionBtn: 'Ver Expediente',
      emailSubject: `Pase Autorizado: #${paddedId} para ${pass.employee_name}`
    }
  }

  if (isRejected) {
    return {
      headerTitle: '*Pase Rechazado* ❌',
      actionPhrase: `esta solicitud ha sido rechazada por ${pass.authorized_by}. Puedes consultar los detalles en el siguiente enlace:`,
      emailTitle: 'Pase Rechazado',
      emailActionBtn: 'Ver Expediente',
      emailSubject: `Pase Rechazado: #${paddedId} para ${pass.employee_name}`
    }
  }

  if (isCancelled) {
    return {
      headerTitle: '*Pase Anulado* 🚫',
      actionPhrase: 'esta solicitud ha sido anulada. Puedes verificarlo aquí:',
      emailTitle: 'Pase Anulado',
      emailActionBtn: 'Ver Expediente',
      emailSubject: `Pase Anulado: #${paddedId} para ${pass.employee_name}`
    }
  }

  return {
    headerTitle: '*Solicitud de Autorización* ⚠️',
    actionPhrase: isExclusive
      ? 'este pase requiere tu autorización exclusiva. Por favor, revisa y resuelve la solicitud accediendo al siguiente enlace seguro:'
      : 'se requiere tu autorización para este pase digital. Por favor, revisa y resuelve la solicitud accediendo al siguiente enlace seguro:',
    emailTitle: 'Solicitud de Autorización',
    emailActionBtn: 'Revisar y Resolver Solicitud',
    emailSubject: `Autorización Requerida: Pase #${paddedId} para ${pass.employee_name}`
  }
}

async function dispatchToTarget(db: any, pass: any, target: AuthorizationTarget, copy: any, authUrlBase: string, requiredText: string, isExclusive: boolean) {
  const rToken = signRecipientToken(target.email, target.name)
  const targetAuthUrl = `${authUrlBase}?r=${rToken}`
  const labels = getNotificationLabels(pass, copy.paddedId, isExclusive)
  const exclusiveLine = isExclusive ? `Este pase solo puede ser autorizado por ${requiredText}.` : ''

  if (target.channels.includes('WHATSAPP')) {
    const chatId = toWhatsAppChatId(target.phone)
    if (chatId && chatId.length > 10) {
      const waMessage = `${labels.headerTitle}\n\n${copy.categoryName} para *${pass.employee_name}*${copy.tipoPermisoMsg}${copy.cambioHorarioMsg}${copy.motivoMsg}${copy.returnMessage}\n${copy.dateRangeMsg}${copy.timeMsg && !copy.isCambioHorario ? copy.timeMsg : ''} - Folio *${copy.paddedId}*${exclusiveLine ? `\n\n${exclusiveLine}` : ''}\n\nHola ${target.name.split(' ')[0]}, ${labels.actionPhrase}\n${targetAuthUrl}`

      try {
        const waRes = await sendWhatsAppMessage({ chatId, message: waMessage })
        const msgId = waRes?.messageId || waRes?.id || 'delivered'
        await logNotification(db, pass.id, chatId, 'sent', `Destinatario autorizado: ${target.name} | Canal: WhatsApp`, msgId)
      } catch {
        await logNotification(db, pass.id, chatId, 'failed', `Destinatario autorizado: ${target.name} | Canal: WhatsApp | Error: Fallo en motor de envío`)
      }
    } else {
      await logNotification(db, pass.id, 'N/A', 'failed', `Destinatario autorizado: ${target.name} | Canal: WhatsApp | Error: Número de celular inválido o ausente`)
    }
  }

  if (target.channels.includes('EMAIL')) {
    const resolvedColor = pass.status === 'autorizado' ? '#059669' : (pass.status === 'rechazado' ? '#dc2626' : '#4f46e5')
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
           <div style="width: 64px; height: 64px; background-color: #eef2ff; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎫</div>
           <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800;">${labels.emailTitle}</h1>
           <p style="margin: 0 0 18px; color: #64748b; font-size: 15px;">Folio <strong>#${copy.paddedId}</strong> &bull; ${copy.categoryName}</p>
           ${exclusiveLine ? `<p style="margin: 0 0 32px; color: ${resolvedColor}; font-size: 13px; font-weight: 800; background: #f8fafc; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0;">${exclusiveLine}</p>` : ''}
           
           <div style="text-align: left; background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Colaborador:</strong><br><span style="color: #0f172a; font-size: 16px; font-weight: 600;">${pass.employee_name}</span></p>
              ${copy.isCambioHorario ? `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Vigencia:</strong><br><span style="color: #0f172a; font-weight: 600;">Del ${copy.formattedDate} al ${copy.endDateFormatted || copy.formattedDate}</span></p>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Nuevo Horario:</strong><br><span style="color: #0f172a; font-weight: 600;">${pass.horario_entrada} a ${pass.horario_salida}</span></p>` : `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Fecha y Hora:</strong><br><span style="color: #0f172a; font-weight: 600;">${copy.formattedDate} ${pass.time ? 'a las ' + pass.time : ''}</span></p>`}
              ${pass.tipo_permiso ? `<p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Tipo de Permiso:</strong><br><span style="color: #0f172a;">${pass.tipo_permiso}</span></p>` : ''}
              ${pass.comentarios ? `<p style="margin: 0; color: #334155; font-size: 14px;"><strong>Motivo:</strong><br><span style="color: #0f172a;">${pass.comentarios}</span></p>` : ''}
              ${(pass.status === 'autorizado' || pass.status === 'rechazado') && pass.authorized_by ? `<p style="margin: 12px 0 0; color: ${pass.status === 'autorizado' ? '#059669' : '#dc2626'}; font-size: 14px;"><strong>${pass.status === 'autorizado' ? 'Autorizado' : 'Rechazado'} por:</strong><br><span style="color: ${pass.status === 'autorizado' ? '#064e3b' : '#991b1b'}; font-weight: 600;">${pass.authorized_by}</span></p>` : ''}
           </div>

           <a href="${targetAuthUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px; transition: background-color 0.2s;">${labels.emailActionBtn}</a>
           
           <p style="margin: 32px 0 0; color: #94a3b8; font-size: 12px;">Emitido por ${pass.user}<br>Plataforma Institucional de Pases Digitales</p>
        </div>
      </div>`

    try {
      await sendWorkspaceEmail(target.email, labels.emailSubject, emailHtml)
      await logNotification(db, pass.id, target.email, 'sent', `Destinatario autorizado: ${target.name} | Canal: Email`)
    } catch {
      await logNotification(db, pass.id, target.email, 'failed', `Destinatario autorizado: ${target.name} | Canal: Email | Error: Fallo interno de Google Workspace`)
    }
  }
}

export async function dispatchNotificationsForPass(passId: number, options: { scheduleTg?: boolean, telegramOnly?: boolean } = {}) {
  const db = useDB()
  const config = useRuntimeConfig()

  const [rows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [passId])
  if (!rows.length) return false

  const pass = rows[0]
  pass.plantel = cleanPlantelName(pass.plantel)

  const isPending = pass.status === 'pendiente'
  const copy = getPassCopy(pass)
  const authUrlBase = `${config.appUrl}/authorize/${pass.auth_token}`

  if (options.telegramOnly) {
    if (isPending) {
      await logNotification(db, pass.id, 'N/A', 'failed', 'Operación bloqueada: no se envía auditoría global de Telegram para pases pendientes.')
      return false
    }
    await sendTelegramAudit(db, pass, { scheduleTg: false }, copy)
    return true
  }

  const resolution = await resolveAuthorizationForPass(pass)

  logAuthorizationDebug('Destinatarios resueltos para notificación de pase.', {
    passId: pass.id,
    status: pass.status,
    plantel: resolution.employeePlantel,
    puesto: resolution.employeePuesto,
    source: resolution.source,
    isExclusive: resolution.isExclusive,
    targetCount: resolution.targets.length,
    targetEmails: resolution.targets.map((target) => target.email)
  })

  if (!resolution.hasTargets) {
    const msg = `Sin destinatarios autorizados. Plantel: ${resolution.employeePlantel || 'N/A'} | Puesto: ${resolution.employeePuesto || 'N/A'} | Fuente: ${resolution.source}`
    logAuthorizationDebug('No se enviaron notificaciones porque no hay destinatarios autorizados.', { passId: pass.id, plantel: resolution.employeePlantel, puesto: resolution.employeePuesto, source: resolution.source }, 'warn')
    await logNotification(db, pass.id, 'N/A', 'failed', msg)
    return true
  }

  if (!isPending) {
    await sendTelegramAudit(db, pass, options, copy)
  }

  for (const target of resolution.targets) {
    await dispatchToTarget(db, pass, target, copy, authUrlBase, resolution.requiredText, resolution.isExclusive)
  }

  return true
}
