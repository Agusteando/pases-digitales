import { useDB } from '~/server/utils/db'
import { getFastSoapEmployees, normalizeName } from '~/server/utils/employee-engine'
import { defineEventHandler, getCookie, createError } from '#imports'
import jwt from 'jsonwebtoken'

// Helpers
const tokenizeName = (name: string): string[] => {
  if (!name) return []
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')    // Deja solo alfanuméricos y espacios
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 2)       // Ignora tokens muy cortos para evitar falsos positivos (ruido)
}

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
        writeLog('info', { message: 'Iniciando motor de sincronización masiva de identidades (Dos Fases)...' })

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
        
        // Populate Map for Phase 1 and prepare Token sets for Phase 2
        const soapDataWithTokens = soapData.map(emp => {
          const norm = normalizeName(emp.name)
          if (!soapMap.has(norm)) soapMap.set(norm, [])
          soapMap.get(norm)!.push(emp)
          
          return {
            ...emp,
            tokens: tokenizeName(emp.name)
          }
        })

        // ==========================================
        // FASE 1: Búsqueda Exacta
        // ==========================================
        let totalRowsUpdated = 0
        const pass1Failures: string[] = []

        writeLog('start_phase1', { total: uniqueNames.length, message: 'Iniciando FASE 1: Resolución por Coincidencia Exacta.' })

        for (const targetName of uniqueNames) {
          const normTarget = normalizeName(targetName)
          const matches = soapMap.get(normTarget) || []

          if (matches.length === 0) {
            pass1Failures.push(targetName)
            writeLog('process1', { status: 'not_found', name: targetName, message: 'Identidad sin coincidencia exacta en SOAP.' })
            continue
          }

          const uniqueIdentities = new Set(matches.map(m => `${m.curp || 'null'}|${m.ClaveUnica || 'null'}`))
          if (uniqueIdentities.size > 1) {
            pass1Failures.push(targetName)
            writeLog('process1', { status: 'ambiguous', name: targetName, message: `Ambigüedad exacta. Pertenece a ${uniqueIdentities.size} identidades distintas.` })
            continue
          }

          const authoritativeMatch = matches[0]
          const newCurp = authoritativeMatch.curp || null
          const newIngressioId = authoritativeMatch.ClaveUnica || null

          if (!newCurp && !newIngressioId) {
             pass1Failures.push(targetName)
             writeLog('process1', { status: 'missing_data', name: targetName, message: 'Encontrado exacto, pero carece de CURP y ClaveUnica.' })
             continue
          }

          // DB Update - Phase 1
          const [updateResult]: any = await db.execute(
            `UPDATE hr_entries SET curp = ?, ingressioId = ? WHERE employee_name = ? AND (curp IS NULL OR curp = '' OR ingressioId IS NULL OR ingressioId = '')`,
            [newCurp, newIngressioId, targetName]
          )
          const affected = updateResult.affectedRows || 0
          totalRowsUpdated += affected

          writeLog('process1', { status: 'success', name: targetName, affected, message: `Coincidencia exacta exitosa. ${affected} filas actualizadas.` })
        }

        // ==========================================
        // FASE 2: Búsqueda por Contención de Tokens
        // ==========================================
        writeLog('info', { message: `Fase 1 finalizada. Iniciando FASE 2 (Fallback por Tokens) para ${pass1Failures.length} identidades no resueltas.` })
        writeLog('start_phase2', { total: pass1Failures.length })

        for (const targetName of pass1Failures) {
          const targetTokens = tokenizeName(targetName)
          
          if (targetTokens.length === 0) {
            writeLog('process2', { status: 'not_found', name: targetName, message: 'El nombre no contiene suficientes tokens válidos para búsqueda determinista.' })
            continue
          }

          // Matching strategy: ALL tokens from the target name must be present in the SOAP name.
          const matches = soapDataWithTokens.filter(soapEmp => {
            return targetTokens.every(token => soapEmp.tokens.includes(token))
          })

          if (matches.length === 0) {
            writeLog('process2', { status: 'not_found', name: targetName, message: `Ningún empleado en SOAP contiene los tokens: [${targetTokens.join(', ')}].` })
            continue
          }

          const uniqueIdentities = new Set(matches.map(m => `${m.curp || 'null'}|${m.ClaveUnica || 'null'}`))
          if (uniqueIdentities.size > 1) {
            writeLog('process2', { status: 'ambiguous', name: targetName, message: `Ambigüedad de tokens. ${matches.length} empleados comparten estos tokens.` })
            continue
          }

          const authoritativeMatch = matches[0]
          const newCurp = authoritativeMatch.curp || null
          const newIngressioId = authoritativeMatch.ClaveUnica || null

          if (!newCurp && !newIngressioId) {
             writeLog('process2', { status: 'missing_data', name: targetName, message: `Coincidencia por tokens encontrada en SOAP (${authoritativeMatch.name}), pero carece de CURP y ClaveUnica.` })
             continue
          }

          // DB Update - Phase 2
          const [updateResult]: any = await db.execute(
            `UPDATE hr_entries SET curp = ?, ingressioId = ? WHERE employee_name = ? AND (curp IS NULL OR curp = '' OR ingressioId IS NULL OR ingressioId = '')`,
            [newCurp, newIngressioId, targetName]
          )
          const affected = updateResult.affectedRows || 0
          totalRowsUpdated += affected

          writeLog('process2', { status: 'success', name: targetName, affected, message: `Coincidencia por tokens (${authoritativeMatch.name}). ${affected} filas actualizadas.` })
        }

        const executionTimeMs = Math.round(performance.now() - startTime)
        writeLog('info', { message: 'Lote de Dos Fases procesado en su totalidad. Construyendo resumen...' })
        
        writeLog('summary', { executionTimeMs })

      } catch (err: any) {
        writeLog('error', { message: `Interrupción crítica del proceso: ${err.message}` })
      } finally {
        controller.close()
      }
    }
  })

  return stream
})