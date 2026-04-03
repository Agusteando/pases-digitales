import { defineEventHandler, deleteCookie } from '#imports'

export default defineEventHandler((event) => {
  deleteCookie(event, 'auth-token', { path: '/' })
  return { success: true }
})