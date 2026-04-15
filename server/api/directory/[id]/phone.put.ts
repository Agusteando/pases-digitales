import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email, phone } = body
  
  if (!id || !email || typeof phone === 'undefined') {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos para actualizar.' })
  }

  // Store in standard 10-digit format
  let finalPhone = String(phone || '').replace(/\D/g, '').substring(0, 10)

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