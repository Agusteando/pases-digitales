import { useDB } from '~/server/utils/db'
import { getFastSoapEmployees, normalizeName } from '~/server/utils/employee-engine'
import { defineEventHandler, getCookie, createError } from '#imports'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  // 1. Auth & Admin Authorization Verification
  const token = getCookie(event, 'auth-token')
  if (!token) throw createError({ statusCode: 401, message: 'Autenticación requerida para acceder al flujo de sincronización.' })

  let actingEmail = null
  try {
    const decoded: any = jwt.decode(token)
    if (decoded && decoded.email) actingEmail = decoded.email
  } catch (e) {}

  if (!actingEmail) throw createError({ statusCode: 401, message: 'Sesión inválida o firma comprometida.' })

  const db = useDB()
  const [adminRows]: any = await db.execute('SELECT is_admin FROM system_users WHERE email = ?', [actingEmail])
  
  if (!adminRows.length || adminRows[0].is_admin !== 1) {
    throw createError({ statusCode: 403, message: 'Acceso denegado. Se requieren privilegios de administrador del sistema.' })
  }

  // 2. Setup Server-Sent NDJSON Stream via ReadableStream (Nitro Standard)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const writeLog = (type: string, payload: any) => {
        const data = JSON.stringify({ type, timestamp: Date.now(), ...payload }) + '\n'
        controller.enqueue(encoder.encode(data))
      }

      const startTime = performance.now()

      try {
        writeLog('info', { message: 'Iniciando motor de sincronización masiva de identidades...' })

        // 3. Query distinct names missing identities
        writeLog('info', { message: 'Consultando nombres únicos pendientes en la base de datos histórica...' })
        const [rows]: any = await db.execute(`
          SELECT DISTINCT employee_name 
          FROM hr_entries 
          WHERE curp IS NULL OR curp = '' OR ingressioId IS NULL OR ingressioId = ''
        `)

        const uniqueNames = rows.map((r: any) => r.employee_name)
        if (uniqueNames.length === 0) {
          writeLog('info', { message: 'No se encontraron registros que requieran sincronización. Todo está al día.' })
          writeLog('summary', { executionTimeMs: Math.round(performance.now() - startTime) })
          controller.close()
          return
        }

        writeLog('info', { message: `Localizados ${uniqueNames.length} nombres únicos que requieren resolución cruzada.` })

        // 4. Download and Index Authoritative SOAP Data
        writeLog('info', { message: 'Contactando servicio SOAP para descarga del directorio institucional...' })
        const soapData = await getFastSoapEmployees()
        writeLog('info', { message: `Directorio SOAP descargado exitosamente. Total de empleados activos: ${soapData.length}.` })

        writeLog('info', { message: 'Construyendo mapa de resolución estructurado en memoria...' })
        const soapMap = new Map<string, any[]>()
        
        for (const emp of soapData) {
          const norm = normalizeName(emp.name)
          if (!soapMap.has(norm)) soapMap.set(norm, [])
          soapMap.get(norm)!.push(emp)
        }

        // 5. Batch Execution per Distinct Name
        let totalRowsUpdated = 0
        let matchesFound = 0
        let matchesNotFound = 0
        let ambiguousMatches = 0

        writeLog('start_batch', { total: uniqueNames.length })

        for (const targetName of uniqueNames) {
          const normTarget = normalizeName(targetName)
          const matches = soapMap.get(normTarget) || []

          if (matches.length === 0) {
            matchesNotFound++
            writeLog('process', { status: 'not_found', name: targetName, message: 'La identidad no existe en el catálogo SOAP actual.' })
            continue
          }

          // Evaluate ambiguity: If a name appears multiple times, check if they are functionally the same person
          // by deduplicating their primary identity keys (CURP & IngressioId).
          const uniqueIdentities = new Set(matches.map(m => `${m.curp || 'null'}|${m.ClaveUnica || 'null'}`))
          if (uniqueIdentities.size > 1) {
            ambiguousMatches++
            writeLog('process', { status: 'ambiguous', name: targetName, message: `Resolución ambigua. El nombre pertenece a ${uniqueIdentities.size} identidades distintas.` })
            continue
          }

          // At this point, we either have exactly 1 record, or multiple identical records representing the same person.
          const authoritativeMatch = matches[0]
          const newCurp = authoritativeMatch.curp || null
          const newIngressioId = authoritativeMatch.ClaveUnica || null

          if (!newCurp && !newIngressioId) {
             matchesNotFound++
             writeLog('process', { status: 'missing_data', name: targetName, message: 'Identidad encontrada en SOAP, pero sus campos CURP y ClaveUnica están vacíos en origen.' })
             continue
          }

          // Execute a single mass UPDATE for ALL rows matching this specific name
          const [updateResult]: any = await db.execute(
            `UPDATE hr_entries 
             SET curp = ?, ingressioId = ? 
             WHERE employee_name = ? 
               AND (curp IS NULL OR curp = '' OR ingressioId IS NULL OR ingressioId = '')`,
            [newCurp, newIngressioId, targetName]
          )

          const affected = updateResult.affectedRows || 0
          totalRowsUpdated += affected
          matchesFound++

          writeLog('process', { status: 'success', name: targetName, affected, message: `Identidad resuelta. ${affected} filas históricas actualizadas exitosamente.` })
        }

        const executionTimeMs = Math.round(performance.now() - startTime)
        writeLog('info', { message: 'Lote procesado en su totalidad. Construyendo resumen de métricas...' })
        
        writeLog('summary', {
          uniqueNamesScanned: uniqueNames.length,
          totalRowsUpdated,
          matchesFound,
          matchesNotFound,
          ambiguousMatches,
          executionTimeMs
        })

      } catch (err: any) {
        writeLog('error', { message: `Interrupción crítica del proceso: ${err.message}` })
      } finally {
        controller.close()
      }
    }
  })

  // Return the standard ReadableStream; Nitro converts this directly to chunked transfer encoding implicitly.
  return stream
})