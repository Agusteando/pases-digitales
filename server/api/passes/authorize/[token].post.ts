import { useDB } from '~/server/utils/db'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, readBody, createError, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const tokenUrl = getRouterParam(event, 'token')
  const body = await readBody(event)
  const { action, rToken } = body

  if (!tokenUrl || !['authorize', 'reject'].includes(action)) {
    throw createError({ statusCode: 400, message: 'Petición inválida.' })
  }

  if (!rToken) throw createError({ statusCode: 401, message: 'Petición de resolución denegada por ausencia de firma de destinatario.' })

  const config = useRuntimeConfig()
  let actingUser = null

  // Rely purely on the cryptographic token distributed to the user via WhatsApp
  try {
    const decoded: any = jwt.verify(rToken, config.jwtSecret)
    if (decoded && decoded.name) actingUser = decoded.name
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Firma de enlace inválida o caducada.' })
  }

  if (!actingUser) throw createError({ statusCode: 401, message: 'Identidad no verificable.' })

  const db = useDB()

  try {
    const [rows]: any = await db.execute(`SELECT id, employee_name, user, status FROM hr_entries WHERE auth_token = ?`, [tokenUrl])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Enlace inválido o documento no encontrado.' })

    const pass = rows[0]

    if (pass.status !== 'pendiente') {
      throw createError({ statusCode: 400, message: `El documento seguro ya fue procesado y su estado actual es: ${pass.status}` })
    }

    if (actingUser === pass.employee_name || actingUser === pass.user) {
      throw createError({ statusCode: 403, message: 'Política de seguridad: Imposible auto-aprobar requerimientos en los que la persona interactuante es el mismo creador o el empleado afectado.' })
    }

    const newStatus = action === 'authorize' ? 'autorizado' : 'rechazado'
    // Log the cryptographic identity as the source of truth
    await db.execute(`UPDATE hr_entries SET status = ?, authorized_by = ?, authorized_at = NOW() WHERE id = ?`, [newStatus, actingUser, pass.id])
    
    return { success: true, status: newStatus }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Error procesando la operación en el motor central.' })
  }
})