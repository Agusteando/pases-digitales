import jwt from 'jsonwebtoken'
import { useRuntimeConfig, defineEventHandler, getCookie } from '#imports'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth-token')
  if (!token) return { user: null }

  try {
    const decoded = jwt.verify(token, useRuntimeConfig().jwtSecret)
    return { user: decoded }
  } catch (e) {
    return { user: null }
  }
})