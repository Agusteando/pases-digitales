import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(() => {
  throw createError({ 
    statusCode: 404, 
    message: 'El módulo de impresión ha sido permanentemente deshabilitado para promover la digitalización total.' 
  })
})