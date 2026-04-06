import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email, phone } = body
  
  if (!id || !email || typeof phone === 'undefined') {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos para actualizar.' })
  }

  // Double layer of strict formatting safety before submitting to external identity provider
  let finalPhone = phone.trim()
  if (finalPhone && !finalPhone.includes('@c.us') && !finalPhone.includes('@g.us')) {
    let digits = finalPhone.replace(/\D/g, '')
    if (digits.length === 10) digits = '521' + digits
    if (digits.length > 0) finalPhone = `${digits}@c.us`
  }

  try {
    await updateWorkspaceUserPhone(email, finalPhone)
    
    // Explicit removal of legacy channel auto-migration. 
    // Phone capture is purely profile enrichment, Email remains the default routing mode.
    
    return { success: true }
  } catch (error) {
    console.error('Phone sync error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al sincronizar el teléfono con Google Workspace.' })
  }
})