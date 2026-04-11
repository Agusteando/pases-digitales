import { defineEventHandler } from '#imports'

// Basic stateless/in-memory protection to avoid spamming the Kardex endpoint 
// from concurrent clicks on this Vercel instance. (Local 2-minute debounce)
let lastTrigger = 0

export default defineEventHandler(async (event) => {
  const now = Date.now()
  
  // 120-second debounce per Vercel serverless instance
  if (now - lastTrigger < 120000) {
    return { status: 'debounced', message: 'La sincronización se solicitó recientemente.' }
  }
  
  try {
    // Ping status before triggering to avoid sending updates if it's already running globally
    const state: any = await $fetch('https://kardex.casitaapps.com/api/estado').catch(() => null)
    
    const isUpdating = state && (
      state.status === 'updating' || 
      state.actualizando === true || 
      state.is_updating === true ||
      state.estado === 'actualizando' ||
      (state.mensaje && state.mensaje.toLowerCase().includes('actualizando'))
    )

    if (isUpdating) {
      return { status: 'already_updating' }
    }

    // Trigger the actual Kardex Python extraction
    await $fetch('https://kardex.casitaapps.com/api/actualizar', { method: 'POST' })
    lastTrigger = Date.now()
    
    return { status: 'triggered' }
  } catch (err: any) {
    console.error('Error triggering Kardex sync', err)
    return { status: 'error', message: err.message }
  }
})