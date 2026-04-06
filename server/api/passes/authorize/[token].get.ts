import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import jwt from 'jsonwebtoken'
import { defineEventHandler, getRouterParam, getQuery, createError, useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const query = getQuery(event)
  const rToken = query.r as string

  if (!token) throw createError({ statusCode: 400, message: 'Enlace malformado.' })
  if (!rToken) throw createError({ statusCode: 401, message: 'Token de destinatario ausente. Asegúrate de usar el enlace exacto enviado a tu dispositivo.' })

  const config = useRuntimeConfig()
  let recipientName = null

  try {
    const decoded: any = jwt.verify(rToken, config.jwtSecret)
    if (decoded && decoded.name) recipientName = decoded.name
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Firma de enlace inválida o expirada.' })
  }

  const db = useDB()
  
  try {
    const [rows]: any = await db.execute(
      `SELECT id, employee_name, date, time, comentarios, category_id, status, plantel, user, authorized_by, authorized_at 
       FROM hr_entries WHERE auth_token = ?`, 
      [token]
    )
    if (!rows.length) throw createError({ statusCode: 404, message: 'Documento seguro no encontrado.' })

    return {
      ...rows[0],
      plantel: cleanPlantelName(rows[0].plantel),
      _viewer: recipientName
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al recuperar los datos del documento.' })
  }
})