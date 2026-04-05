import { useDB } from '~/server/utils/db'
import { randomBytes } from 'crypto'
import { defineEventHandler, getRouterParam, createError } from '#imports'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { getSigniaEnrichment } from '~/server/utils/employee-engine'

// Normalizes a workspace phone number to a valid WhatsApp Chat ID
const toWhatsAppChatId = (phone: string) => {
  if (phone.includes('@')) return phone // already formatted (e.g. groups or @c.us)
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) cleaned = `521${cleaned}`
  return `${cleaned}@c.us`
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400 })

  const db = useDB()
  
  // 1. Fetch pass details
  const [rows]: any = await db.execute('SELECT * FROM hr_entries WHERE id = ?', [id])
  if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

  const pass = rows[0]

  const categories: Record<number, string> = {
    1: 'Pase de entrada', 2: 'Pase de salida', 3: 'Pase para faltar', 4: 'Pase cambio de horario', 5: 'Incapacidad'
  }
  const categoryName = categories[pass.category_id] || 'Pase'
  const paddedId = String(pass.id).padStart(5, '0')
  const formattedDate = new Date(pass.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  const returnMessage = pass.hora_regreso ? `Se espera su regreso al plantel a las ${pass.hora_regreso}.` : ''

  const results: any[] = []

  // 2. Global Telegram Notification (Legacy Group Workflow)
  // Always routes here unconditionally as the master operational log
  const telegramGlobalId = '-1003057962499'
  const tgObfuscatedId = `${pass.id}-${randomBytes(5).toString('hex')}`
  const tgLongUrl = `https://api.casitaiedis.edu.mx/incidencias/${tgObfuscatedId}-TG`
  const tgMessage = `*Favor de autorizar* ${categoryName} de *${pass.employee_name}* con motivo ${pass.comentarios || 'N/A'} ${returnMessage}\nFecha: ${formattedDate} - Hora: - ${pass.time || 'N/A'} - Folio *${paddedId}*\n\n${tgLongUrl}`

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

  // 3. Dynamic WhatsApp Notification using Configurable Rule Engine
  const empData = await getSigniaEnrichment(pass.employee_name)
  const empPuesto = (empData.puesto || 'Desconocido').trim()
  const empPlantel = (pass.plantel || '').trim()

  const [rules]: any = await db.execute('SELECT * FROM notification_rules')
  
  const waTargets = new Set<string>()
  let matchedAnyRule = false

  for (const rule of rules) {
     const matchPlantel = rule.condition_plantel === 'ALL' || rule.condition_plantel === empPlantel
     const matchPuesto = rule.condition_puesto === 'ALL' || rule.condition_puesto.toLowerCase() === empPuesto.toLowerCase()
     
     if (matchPlantel && matchPuesto) {
         matchedAnyRule = true
         if (rule.target_type === 'CONTACT') {
             const gwData = await getCachedWorkspaceUser(rule.target_val)
             if (gwData.phone && gwData.phone.length >= 10) {
                 waTargets.add(toWhatsAppChatId(gwData.phone))
             }
         } else if (rule.target_type === 'CUSTOM') {
             waTargets.add(toWhatsAppChatId(rule.target_val))
         }
     }
  }

  // 4. Fallback Behavior: If no custom rules were triggered, fallback to all directory contacts in the same plantel
  if (!matchedAnyRule) {
      const [contacts]: any = await db.execute('SELECT email FROM hr_directory WHERE plantel = ?', [empPlantel])
      for (const contact of contacts) {
          if (contact.email) {
            const gwData = await getCachedWorkspaceUser(contact.email)
            if (gwData.phone && gwData.phone.length >= 10) {
              waTargets.add(toWhatsAppChatId(gwData.phone))
            }
          }
      }
  }

  // Dispatch to all collected WhatsApp Targets
  for (const chatId of waTargets) {
    const obfuscatedId = `${pass.id}-${randomBytes(5).toString('hex')}`
    const longUrl = `https://api.casitaiedis.edu.mx/incidencias/${obfuscatedId}-${chatId}`
    const message = `*Favor de autorizar* ${categoryName} de *${pass.employee_name}* con motivo ${pass.comentarios || 'N/A'} ${returnMessage}\nFecha: ${formattedDate} - Hora: - ${pass.time || 'N/A'} - Folio *${paddedId}*\n\n${longUrl}`

    try {
      await $fetch('https://pumpea.shop/whatsapp-manager/bot/send/jurado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ chatId, message }).toString()
      })
      results.push({ platform: 'whatsapp', chatId, status: 'success' })
    } catch (e) {
      console.error('WhatsApp dispatch failed', e)
      results.push({ platform: 'whatsapp', chatId, status: 'error' })
    }
  }

  return { success: true, results }
})