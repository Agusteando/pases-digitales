import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser, sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { getSigniaEnrichment, cleanPlantelName } from '~/server/utils/employee-engine'
import { sendWhatsAppMessage } from '~/server/utils/whatsappModule'
import jwt from 'jsonwebtoken'
import { useRuntimeConfig } from '#imports'

const toWhatsAppChatId = (phone: string) => {
  if (phone.includes('@')) return phone
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = `521${cleaned}`
  return `${cleaned}@c.us`
}

export async function dispatchNotificationsForPass(passId: number) {
  const db = useDB()
  const config = useRuntimeConfig()

  const [rows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [passId])
  if (!rows.length) return false

  const pass = rows[0]
  pass.plantel = cleanPlantelName(pass.plantel)

  const categories: Record<number, string> = {
    1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
  }
  const categoryName = categories[pass.category_id] || 'Pase'
  const paddedId = String(pass.id).padStart(5, '0')
  const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

  // Variables strictly formatted for clarity
  const motivoMsg = pass.comentarios ? ` con motivo ${pass.comentarios}` : ''
  const returnMessage = pass.hora_regreso ? ` Se espera su regreso al plantel a las ${pass.hora_regreso}.` : ''
  const timeMsg = pass.time ? ` - Hora: - ${pass.time}` : ''

  const authUrlBase = `${config.appUrl}/authorize/${pass.auth_token}`

  // 1. Mandatory Global Infrastructure Audit (Fixed, Non-Configurable)
  const telegramGlobalId = '-1003057962499'
  const tgMessage = `${categoryName} de *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate}${timeMsg} - Folio *${paddedId}*`

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
    await db.execute(
      'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
      [pass.id, telegramGlobalId, 'sent', `Sistema: Auditoría Global | Método: Telegram`]
    )
  } catch (e: any) {
    await db.execute(
      'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
      [pass.id, telegramGlobalId, 'failed', `Sistema: Auditoría Global | Método: Telegram | Error: ${e.message || 'Fallo de red'}`]
    )
  }

  // 2. Individual Target Resolution (Configurable Routing)
  const empData = await getSigniaEnrichment(pass.employee_name)
  const empPuesto = (empData.puesto || '').trim()
  const empPlantel = pass.plantel || ''

  const targets = new Map<string, { email: string, name: string, phone: string, channels: Set<string> }>()

  async function addTarget(email: string, channel: string) {
    if (!email) return
    const gw = await getCachedWorkspaceUser(email)
    let current = targets.get(email)
    if (!current) {
      current = { email, name: gw.name || email.split('@')[0], phone: gw.phone, channels: new Set() }
      targets.set(email, current)
    }
    if (channel === 'WHATSAPP' || channel === 'EMAIL') {
      current.channels.add(channel)
    }
  }

  // Bind Base Plantel Contacts
  const [contacts]: any = await db.execute('SELECT email, channel FROM hr_directory WHERE plantel = ?', [empPlantel])
  for (const contact of contacts) await addTarget(contact.email, contact.channel)

  // Bind Explicit Notification Rules
  const [rules]: any = await db.execute('SELECT * FROM notification_rules')
  for (const rule of rules) {
    const rulePlantel = cleanPlantelName(rule.condition_plantel) || 'ALL'
    const matchPlantel = rulePlantel === 'ALL' || rulePlantel === empPlantel
    const matchPuesto = rule.condition_puesto === 'ALL' || rule.condition_puesto.toLowerCase() === empPuesto.toLowerCase()
    if (matchPlantel && matchPuesto && rule.target_val) {
      await addTarget(rule.target_val, rule.channel)
    }
  }

  // 3. Dispatch Configurable Channels & Audit Trail
  for (const [email, target] of targets.entries()) {
    // Crucial requirement: Every target gets a customized Cryptographic Recipient Token appended to the Base Auth URL
    const rToken = jwt.sign(
      { passId: pass.id, email: target.email, name: target.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
    const targetAuthUrl = `${authUrlBase}?r=${rToken}`

    if (target.channels.has('WHATSAPP')) {
      const chatId = toWhatsAppChatId(target.phone)
      if (chatId && chatId.length > 10) {
        
        // Exact inclusion of the Authorization Link within the core Notification Payload
        const waMessage = `*Solicitud de Autorización* ⚠️\n\n${categoryName} para *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate}${timeMsg} - Folio *${paddedId}*\n\nHola ${target.name.split(' ')[0]}, se requiere tu autorización para este pase digital. Por favor, revisa y resuelve la solicitud accediendo al siguiente enlace seguro:\n${targetAuthUrl}`

        try {
          const waRes = await sendWhatsAppMessage({ chatId, message: waMessage })
          const msgId = waRes?.messageId || waRes?.id || 'delivered'
          await db.execute(
            'INSERT INTO notification_logs (pass_id, chat_id, status, message_id, error_text) VALUES (?, ?, ?, ?, ?)',
            [pass.id, chatId, 'sent', msgId, `Destinatario: ${target.name} | Canal: WhatsApp`]
          )
        } catch (e: any) {
          await db.execute(
            'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
            [pass.id, chatId, 'failed', `Destinatario: ${target.name} | Canal: WhatsApp | Error: Fallo en motor de envío`]
          )
        }
      } else {
        await db.execute(
          'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
          [pass.id, 'N/A', 'failed', `Destinatario: ${target.name} | Canal: WhatsApp | Error: Número de celular inválido o ausente`]
        )
      }
    }

    if (target.channels.has('EMAIL')) {
      const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-w: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
           <div style="width: 64px; height: 64px; background-color: #eef2ff; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎫</div>
           <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800;">Solicitud de Autorización</h1>
           <p style="margin: 0 0 32px; color: #64748b; font-size: 15px;">Folio <strong>#${paddedId}</strong> &bull; ${categoryName}</p>
           
           <div style="text-align: left; background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Colaborador:</strong><br><span style="color: #0f172a; font-size: 16px; font-weight: 600;">${pass.employee_name}</span></p>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Fecha y Hora:</strong><br><span style="color: #0f172a; font-weight: 600;">${formattedDate} ${pass.time ? 'a las ' + pass.time : ''}</span></p>
              ${pass.comentarios ? `<p style="margin: 0; color: #334155; font-size: 14px;"><strong>Motivo:</strong><br><span style="color: #0f172a;">${pass.comentarios}</span></p>` : ''}
           </div>

           <!-- Exact inclusion of the Authorization Link within the core Notification Payload -->
           <a href="${targetAuthUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px; transition: background-color 0.2s;">Revisar y Resolver Solicitud</a>
           
           <p style="margin: 32px 0 0; color: #94a3b8; font-size: 12px;">Emitido por ${pass.user}<br>Plataforma Institucional de Pases Digitales</p>
        </div>
      </div>`;

      try {
        await sendWorkspaceEmail(target.email, `Autorización Requerida: Pase #${paddedId} para ${pass.employee_name}`, emailHtml)
        await db.execute(
          'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
          [pass.id, target.email, 'sent', `Destinatario: ${target.name} | Canal: Email`]
        )
      } catch (e: any) {
        await db.execute(
          'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
          [pass.id, target.email, 'failed', `Destinatario: ${target.name} | Canal: Email | Error: Fallo interno de red/proveedor`]
        )
      }
    }
  }

  return true
}