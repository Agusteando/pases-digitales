import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, createError, useRuntimeConfig } from '#imports'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { getSigniaEnrichment } from '~/server/utils/employee-engine'

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

  const categories: Record<number, string> = {
    1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
  }
  const categoryName = categories[pass.category_id] || 'Pase'
  const paddedId = String(pass.id).padStart(5, '0')
  const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const returnMessage = pass.hora_regreso ? `\nRetorno estimado: ${pass.hora_regreso}` : ''
  const motivoMsg = pass.comentarios ? `\nMotivo: ${pass.comentarios}` : ''
  const timeMsg = pass.time ? `\nHora: ${pass.time}` : ''

  // Secure Public Auth URL Base
  const authUrlBase = `${config.appUrl}/authorize/${pass.auth_token}`

  const results: any[] = []

  // 1. Global Telegram Notification (Auditable Operations Path)
  const telegramGlobalId = '-1003057962499'
  // No ?r= token here since this channel is readonly notification for broad audiences.
  const tgMessage = `*REQUERIMIENTO OPERATIVO*\n${categoryName} de *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate}${timeMsg}\nFolio *${paddedId}*\nEmitido por: ${pass.user}`

  try {
    await $fetch('https://tgbot.casitaapps.com/sendMessages', {
      method: 'POST',
      body: { chatId: [telegramGlobalId], message: tgMessage, disable_notification: false }
    })
    results.push({ platform: 'telegram', status: 'success' })
  } catch (e) {
    console.error('Telegram dispatch failed', e)
    results.push({ platform: 'telegram', status: 'error' })
  }

  // 2. Map Collection for Individualized Notification Over WhatsApp
  const empData = await getSigniaEnrichment(pass.employee_name)
  const empPuesto = (empData.puesto || '').trim()
  const empPlantel = (pass.plantel || '').trim()

  const targets = new Map<string, { email: string, name: string }>()
  
  async function addTarget(email: string) {
    if (!email) return
    const gw = await getCachedWorkspaceUser(email)
    const chat = toWhatsAppChatId(gw.phone)
    if (chat && chat.length > 10) {
      targets.set(chat, { email, name: gw.name || email.split('@')[0] })
    }
  }

  // Directives from Directory
  const [contacts]: any = await db.execute('SELECT email FROM hr_directory WHERE plantel = ?', [empPlantel])
  for (const contact of contacts) await addTarget(contact.email)

  // Directives from Rules
  const [rules]: any = await db.execute('SELECT * FROM notification_rules')
  for (const rule of rules) {
     const matchPlantel = rule.condition_plantel === 'ALL' || rule.condition_plantel === empPlantel
     const matchPuesto = rule.condition_puesto === 'ALL' || rule.condition_puesto.toLowerCase() === empPuesto.toLowerCase()
     if (matchPlantel && matchPuesto && rule.target_val) {
         await addTarget(rule.target_val)
     }
  }

  // 3. Dispatch Decentralized Auth Notifications
  for (const [chatId, target] of targets) {
    // We sign a highly specific JWT for this exact user/pass combination allowing login-free interaction
    const rToken = jwt.sign(
      { passId: pass.id, email: target.email, name: target.name }, 
      config.jwtSecret, 
      { expiresIn: '7d' }
    )
    const targetAuthUrl = `${authUrlBase}?r=${rToken}`
    
    const waMessage = `*Requiere Autorización* ⚠️\n\n${categoryName} para *${pass.employee_name}*${motivoMsg}${returnMessage}\nFecha: ${formattedDate} - Folio *${paddedId}*\n\nHola ${target.name.split(' ')[0]}, por favor revisa y resuelve esta solicitud:\n${targetAuthUrl}`

    try {
      await $fetch('https://pumpea.shop/whatsapp-manager/bot/send/jurado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ chatId, message: waMessage }).toString()
      })
      results.push({ platform: 'whatsapp', chatId, target: target.name, status: 'success' })
    } catch (e) {
      console.error('WhatsApp dispatch failed', e)
      results.push({ platform: 'whatsapp', chatId, target: target.name, status: 'error' })
    }
  }

  return { success: true, results }
})