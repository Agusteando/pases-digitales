import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, createError, useRuntimeConfig } from '#imports'
import { getCachedWorkspaceUser, sendWorkspaceEmail } from '~/server/utils/googleWorkspace'
import { getSigniaEnrichment, cleanPlantelName } from '~/server/utils/employee-engine'

const toWhatsAppChatId = (phone: string) => {
  if (phone.includes('@')) return phone
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = `521${cleaned}`
  return `${cleaned}@c.us`
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const db = useDB()
  const config = useRuntimeConfig()
  
  const [rows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [id])
  if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

  const pass = rows[0]
  pass.plantel = cleanPlantelName(pass.plantel)

  const categories: Record<number, string> = {
    1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
  }
  const categoryName = categories[pass.category_id] || 'Pase'
  const paddedId = String(pass.id).padStart(5, '0')
  const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const returnMessage = pass.hora_regreso ? `\nRetorno estimado: ${pass.hora_regreso}` : ''
  const motivoMsg = pass.comentarios ? `\nMotivo: ${pass.comentarios}` : ''
  const timeMsg = pass.time ? `\nHora: ${pass.time}` : ''

  const authUrlBase = `${config.appUrl}/authorize/${pass.auth_token}`

  const results: any[] = []

  const telegramGlobalId = '-1003057962499'
  const tgMessage = `*REQUERIMIENTO OPERATIVO*\n${categoryName} de *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate}${timeMsg}\nFolio *${paddedId}*\nEmitido por: ${pass.user}`

  try {
    await $fetch('https://tgbot.casitaapps.com/sendMessages', {
      method: 'POST',
      body: { chatId: [telegramGlobalId], message: tgMessage, disable_notification: false }
    })
    results.push({ platform: 'telegram', status: 'success' })
  } catch (e) {
    results.push({ platform: 'telegram', status: 'error' })
  }

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
    current.channels.add(channel || 'EMAIL')
  }

  const [contacts]: any = await db.execute('SELECT email, channel FROM hr_directory WHERE plantel = ?', [empPlantel])
  for (const contact of contacts) await addTarget(contact.email, contact.channel)

  const [rules]: any = await db.execute('SELECT * FROM notification_rules')
  for (const rule of rules) {
     const rulePlantel = cleanPlantelName(rule.condition_plantel) || 'ALL'
     const matchPlantel = rulePlantel === 'ALL' || rulePlantel === empPlantel
     const matchPuesto = rule.condition_puesto === 'ALL' || rule.condition_puesto.toLowerCase() === empPuesto.toLowerCase()
     if (matchPlantel && matchPuesto && rule.target_val) {
         await addTarget(rule.target_val, rule.channel)
     }
  }

  for (const [email, target] of targets.entries()) {
    const rToken = jwt.sign(
      { passId: pass.id, email: target.email, name: target.name }, 
      config.jwtSecret, 
      { expiresIn: '7d' }
    )
    const targetAuthUrl = `${authUrlBase}?r=${rToken}`

    if (target.channels.has('WHATSAPP')) {
      const chatId = toWhatsAppChatId(target.phone)
      if (chatId && chatId.length > 10) {
        const waMessage = `*Requiere Autorización* ⚠️\n\n${categoryName} para *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate} - Folio *${paddedId}*\n\nHola ${target.name.split(' ')[0]}, por favor revisa y resuelve esta solicitud:\n${targetAuthUrl}`
        try {
          await $fetch('https://pumpea.shop/whatsapp-manager/bot/send/jurado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ chatId, message: waMessage }).toString()
          })
          results.push({ platform: 'whatsapp', target: target.name, status: 'success' })
        } catch (e) {
          results.push({ platform: 'whatsapp', target: target.name, status: 'error' })
        }
      } else {
        results.push({ platform: 'whatsapp', target: target.name, status: 'error_no_phone' })
      }
    }

    if (target.channels.has('EMAIL')) {
      const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; text-align: center;">
        <div style="max-w: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
           <div style="width: 64px; height: 64px; background-color: #eef2ff; border-radius: 16px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 24px;">🎫</div>
           <h1 style="margin: 0 0 8px; color: #0f172a; font-size: 24px; font-weight: 800;">Requiere Autorización</h1>
           <p style="margin: 0 0 32px; color: #64748b; font-size: 15px;">Folio <strong>#${paddedId}</strong> &bull; ${categoryName}</p>
           
           <div style="text-align: left; background-color: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Colaborador:</strong><br><span style="color: #0f172a; font-size: 16px; font-weight: 600;">${pass.employee_name}</span></p>
              <p style="margin: 0 0 12px; color: #334155; font-size: 14px;"><strong>Fecha y Hora:</strong><br><span style="color: #0f172a; font-weight: 600;">${formattedDate} ${pass.time ? 'a las ' + pass.time : ''}</span></p>
              ${pass.comentarios ? `<p style="margin: 0; color: #334155; font-size: 14px;"><strong>Motivo:</strong><br><span style="color: #0f172a;">${pass.comentarios}</span></p>` : ''}
           </div>

           <a href="${targetAuthUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 16px; transition: background-color 0.2s;">Revisar y Resolver Solicitud</a>
           
           <p style="margin: 32px 0 0; color: #94a3b8; font-size: 12px;">Emitido por ${pass.user}<br>Plataforma Institucional de Pases Digitales</p>
        </div>
      </div>`;

      try {
        await sendWorkspaceEmail(target.email, `Autorización Requerida: Pase #${paddedId} para ${pass.employee_name}`, emailHtml)
        results.push({ platform: 'email', target: target.name, status: 'success' })
      } catch (e) {
        results.push({ platform: 'email', target: target.name, status: 'error' })
      }
    }
  }

  return { success: true, results }
})