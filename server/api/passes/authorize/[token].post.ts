import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { getCookie, defineEventHandler, getRouterParam, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const tokenUrl = getRouterParam(event, 'token')
  const body = await readBody(event)
  const { action } = body

  if (!tokenUrl || !['authorize', 'reject'].includes(action)) {
    throw createError({ statusCode: 400, message: 'Petición inválida.' })
  }

  const cookieToken = getCookie(event, 'auth-token')
  let actingUser = 'Sistema'
  
  if (cookieToken) {
    try {
      const decoded: any = jwt.decode(cookieToken)
      if (decoded && decoded.name) actingUser = decoded.name
    } catch (e) {}
  }

  const db = useDB()

  try {
    const [rows]: any = await db.execute(`SELECT id, employee_name, status FROM hr_entries WHERE auth_token = ?`, [tokenUrl])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Enlace inválido.' })

    const pass = rows[0]

    if (pass.status !== 'pendiente') {
      throw createError({ statusCode: 400, message: `El pase ya fue procesado y su estado es: ${pass.status}` })
    }

    if (actingUser === pass.employee_name) {
      throw createError({ statusCode: 403, message: 'No puedes autorizar tu propio pase.' })
    }

    const newStatus = action === 'authorize' ? 'autorizado' : 'rechazado'
    await db.execute(`UPDATE hr_entries SET status = ?, authorized_by = ?, authorized_at = NOW() WHERE id = ?`, [newStatus, actingUser, pass.id])
    
    return { success: true, status: newStatus }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Ocurrió un error al procesar la autorización.' })
  }
})