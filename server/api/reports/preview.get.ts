import { defineEventHandler, getQuery, createError, getCookie } from '#imports'
import jwt from 'jsonwebtoken'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { plantel, fecha_inicio, fecha_fin } = getQuery(event)
  
  if (!plantel || !fecha_inicio || !fecha_fin) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos para la consulta.' })
  }

  // 1. Autenticación
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Sesión no autorizada.' })
  
  let decoded: any
  try {
    decoded = jwt.decode(token)
    if (!decoded || !decoded.email) throw new Error()
  } catch {
    throw createError({ statusCode: 401, message: 'Firma de sesión inválida.' })
  }

  // 2. Control de Acceso y Visibilidad (Global Admin vs Plantel Admin)
  const db = useDB()
  const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [decoded.email])
  const isAdmin = adminRows?.[0]?.is_admin === 1

  if (!isAdmin) {
    const [dirRows]: any = await db.execute('SELECT plantel FROM hr_directory WHERE email = ? AND role = "ADMON"', [decoded.email])
    const planteles = dirRows.map((r: any) => r.plantel)
    
    if (!planteles.includes(plantel as string)) {
      throw createError({ statusCode: 403, message: 'Acceso denegado. No cuentas con permisos operativos (rol ADMON) para consultar la información de este plantel.' })
    }
  }

  // 3. Proxy hacia el motor de Kardex Externo
  try {
    const backendUrl = `https://kardex.casitaapps.com/api/crossover/plantel/${encodeURIComponent(plantel as string)}?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`
    
    const data = await $fetch(backendUrl)
    return data
    
  } catch (error: any) {
    console.error('Error de comunicación con Kardex Crossover API', error)
    throw createError({ statusCode: 502, message: 'Error de conectividad al intentar contactar el motor de reportes (Kardex API).' })
  }
})