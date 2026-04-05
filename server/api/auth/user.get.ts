import jwt from 'jsonwebtoken'
import { useRuntimeConfig, defineEventHandler, getCookie } from '#imports'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token')
  if (!token) return { user: null }

  try {
    const config = useRuntimeConfig()
    const decoded: any = jwt.verify(token, config.jwtSecret)
    
    const db = useDB()
    const [rows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [decoded.email])
    const is_admin = rows.length > 0 ? Boolean(rows[0].is_admin) : false

    return { user: { ...decoded, is_admin } }
  } catch (e) {
    return { user: null }
  }
})