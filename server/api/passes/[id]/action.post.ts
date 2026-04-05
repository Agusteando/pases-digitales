import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { getCookie } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { action } = body
  
  if (!id || !action) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos' })
  }

  const token = getCookie(event, 'auth-token')
  let actingUser = 'Sistema'
  
  if (token) {
    try {
      const decoded: any = jwt.decode(token)
      if (decoded && decoded.name) {
        actingUser = decoded.name
      }
    } catch (e) {}
  }

  const db = useDB()

  try {
    const [rows]: any = await db.execute(`SELECT employee_name FROM hr_entries WHERE id = ?`, [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado' })

    const pass = rows[0]

    // Separation of Duties Verification
    if (['authorize', 'reject'].includes(action) && actingUser === pass.employee_name) {
      throw createError({ statusCode: 403, message: 'Políticas de seguridad prohíben la auto-autorización de pases.' })
    }

    if (action === 'resend') {
      await db.execute(`UPDATE hr_entries SET sync_request = 0 WHERE id = ?`, [id])
      return { success: true }
    } 
    
    if (action === 'authorize') {
      await db.execute(`UPDATE hr_entries SET status = 'autorizado', authorized_by = ?, authorized_at = NOW() WHERE id = ?`, [actingUser, id])
      return { success: true }
    }

    if (action === 'reject') {
      await db.execute(`UPDATE hr_entries SET status = 'rechazado', authorized_by = ?, authorized_at = NOW() WHERE id = ?`, [actingUser, id])
      return { success: true }
    }
    
    if (action === 'cancel') {
      await db.execute(`UPDATE hr_entries SET status = 'cancelado' WHERE id = ?`, [id])
      return { success: true }
    }

    throw createError({ statusCode: 400, message: 'Acción no reconocida' })
  } catch (error: any) {
    console.error("Action error:", error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Error en base de datos' })
  }
})