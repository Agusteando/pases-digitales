import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getCookie } from '#imports'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token')
  if (!token) return null
  
  try {
    const decoded: any = jwt.decode(token)
    if (!decoded || !decoded.email) return null

    const gw = await getCachedWorkspaceUser(decoded.email)
    const db = useDB()
    const [rows]: any = await db.execute('SELECT plantel FROM hr_directory WHERE email = ?', [decoded.email])

    return {
       email: decoded.email,
       name: decoded.name,
       phone: gw.phone ? gw.phone.replace(/\D/g, '').slice(-10) : '',
       authorizedPlanteles: rows.map((r: any) => r.plantel)
    }
  } catch (e) {
    console.error('Failed to fetch user profile:', e)
    return null
  }
})