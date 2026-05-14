import jwt from 'jsonwebtoken'
import { getCookie, createError } from '#imports'
import { useDB } from '~/server/utils/db'

export async function requireAdmin(event: any) {
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida.' })

  const decoded: any = jwt.decode(token)
  const email = decoded?.email
  const name = decoded?.name
  if (!email) throw createError({ statusCode: 401, message: 'Sesión inválida o expirada.' })

  const db = useDB()
  const [rows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [email])
  const isAdmin = rows.length > 0 && rows[0].is_admin === 1
  if (!isAdmin) throw createError({ statusCode: 403, message: 'Permisos insuficientes. Se requiere administrador.' })

  return { email, name, isAdmin }
}
