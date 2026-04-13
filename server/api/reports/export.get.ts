import { defineEventHandler, getQuery, createError, getCookie, setHeader } from '#imports'
import jwt from 'jsonwebtoken'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { plantel, fecha_inicio, fecha_fin } = getQuery(event)
  
  if (!plantel || !fecha_inicio || !fecha_fin) {
    throw createError({ statusCode: 400, message: 'Parámetros de extracción incompletos.' })
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

  // 2. Control de Acceso Restringido
  const db = useDB()
  const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [decoded.email])
  const isAdmin = adminRows?.[0]?.is_admin === 1

  if (!isAdmin) {
    const [dirRows]: any = await db.execute('SELECT plantel FROM hr_directory WHERE email = ?', [decoded.email])
    const planteles = dirRows.map((r: any) => r.plantel)
    
    if (!planteles.includes(plantel as string)) {
      throw createError({ statusCode: 403, message: 'Privilegios insuficientes para descargar el reporte de este plantel.' })
    }
  }

  // 3. Proxy de Descarga hacia Kardex Externo
  try {
    const backendUrl = `https://kardex.casitaapps.com/api/rp/export/plantel/${encodeURIComponent(plantel as string)}?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`
    
    // Stream del documento originado en Python (OpenPyXL / Pandas)
    const response = await fetch(backendUrl)
    
    if (!response.ok) {
      throw new Error('El motor Kardex devolvió un error HTTP al intentar construir el archivo Excel.')
    }
    
    const buffer = await response.arrayBuffer()
    
    const safePlantelName = (plantel as string).replace(/\s+/g, '_')
    const fileName = `Reporte_RP_${safePlantelName}_${fecha_inicio}.xlsx`
    
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    
    return buffer
    
  } catch (error: any) {
    console.error('Error en Proxy de Exportación RP', error)
    throw createError({ statusCode: 502, message: 'Fallo de comunicación con el motor de reportes al solicitar el documento final.' })
  }
})