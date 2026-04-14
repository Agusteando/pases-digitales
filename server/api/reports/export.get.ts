import { defineEventHandler, getQuery, createError, getCookie, setResponseHeader } from '#imports'
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

  // 3. Proxy Binario hacia Kardex Externo
  try {
    const backendUrl = `https://kardex.casitaapps.com/api/rp/export/plantel/${encodeURIComponent(plantel as string)}?fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`
    
    const response = await fetch(backendUrl)
    
    if (!response.ok) {
      throw createError({ statusCode: response.status, message: 'El motor Kardex rechazó la solicitud de descarga o no encontró datos.' })
    }
    
    // Traspasar los headers binarios originales del backend (FastAPI)
    const contentType = response.headers.get('content-type')
    const contentDisposition = response.headers.get('content-disposition')
    
    if (contentType) {
      setResponseHeader(event, 'Content-Type', contentType)
    } else {
      setResponseHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    if (contentDisposition) {
      setResponseHeader(event, 'Content-Disposition', contentDisposition)
    }

    // Retornar el ReadableStream original directamente evita la corrupción de ArrayBuffer en Nitro
    // y transmite el archivo binario bit a bit sin cargarlo completo en memoria.
    return response.body
    
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error en Proxy Binario de Exportación RP', error)
    throw createError({ statusCode: 502, message: 'Fallo de comunicación con el motor de reportes al solicitar el documento final.' })
  }
})