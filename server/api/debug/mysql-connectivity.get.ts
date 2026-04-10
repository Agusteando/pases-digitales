import { defineEventHandler, useRuntimeConfig } from '#imports'
import dns from 'dns'
import net from 'net'
import mysql from 'mysql2/promise'
import { performance } from 'perf_hooks'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // 0. Recopilación de Configuración (Sin secretos)
  const host = config.mysqlHost || 'localhost'
  const port = Number(process.env.MYSQL_PORT || 3306)
  const user = config.mysqlUser || 'root'
  const database = config.mysqlDatabase || 'Sistemas'

  const report: any = {
    timestamp: new Date().toISOString(),
    target: { host, port, user, database },
    phases: {
      dns: { status: 'pending', timeMs: 0 },
      tcp: { status: 'pending', timeMs: 0 },
      mysql_connect: { status: 'pending', timeMs: 0 },
      mysql_query: { status: 'pending', timeMs: 0 }
    }
  }

  // Helper para redondear milisegundos
  const roundMs = (start: number) => Math.round((performance.now() - start) * 100) / 100

  // 1. Fase de Resolución DNS
  const dnsStart = performance.now()
  try {
    const addresses = await dns.promises.lookup(host, { all: true })
    report.phases.dns = {
      status: 'success',
      timeMs: roundMs(dnsStart),
      resolved_ips: addresses.map(a => `${a.address} (IPv${a.family})`)
    }
  } catch (error: any) {
    report.phases.dns = {
      status: 'failed',
      timeMs: roundMs(dnsStart),
      error_code: error.code,
      message: error.message
    }
    // Si falla el DNS, no podemos continuar con las demás pruebas
    report.phases.tcp.status = 'skipped'
    report.phases.mysql_connect.status = 'skipped'
    report.phases.mysql_query.status = 'skipped'
    return report
  }

  // 2. Fase de Accesibilidad TCP en crudo
  const tcpStart = performance.now()
  try {
    await new Promise((resolve, reject) => {
      const socket = new net.Socket()
      socket.setTimeout(5000) // 5s timeout estricto para TCP puro
      
      socket.on('connect', () => {
        socket.destroy()
        resolve(true)
      })
      
      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error('TCP Socket Timeout (5000ms) - Verifique Firewall/NAT/Reglas de Red'))
      })
      
      socket.on('error', (err) => {
        socket.destroy()
        reject(err)
      })
      
      socket.connect(port, host)
    })
    
    report.phases.tcp = {
      status: 'success',
      timeMs: roundMs(tcpStart)
    }
  } catch (error: any) {
    report.phases.tcp = {
      status: 'failed',
      timeMs: roundMs(tcpStart),
      error_code: error.code || 'TIMEOUT',
      message: error.message
    }
    report.phases.mysql_connect.status = 'skipped'
    report.phases.mysql_query.status = 'skipped'
    return report
  }

  // 3. Fase de Conexión y Protocolo MySQL
  const mysqlStart = performance.now()
  let connection: mysql.Connection | null = null
  
  try {
    // Creamos una conexión aislada (NO usamos el pool de la app) para diagnosticar de cero
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password: config.mysqlPassword || '',
      database,
      connectTimeout: 8000 // Previene el cuelgue infinito si el handshake falla a medias
    })
    
    report.phases.mysql_connect = {
      status: 'success',
      timeMs: roundMs(mysqlStart)
    }
  } catch (error: any) {
    report.phases.mysql_connect = {
      status: 'failed',
      timeMs: roundMs(mysqlStart),
      error_code: error.code,
      message: error.message
    }
    report.phases.mysql_query.status = 'skipped'
    return report
  }

  // 4. Fase de Ejecución de Query (SELECT 1)
  const queryStart = performance.now()
  try {
    await connection.query('SELECT 1 as alive')
    report.phases.mysql_query = {
      status: 'success',
      timeMs: roundMs(queryStart)
    }
  } catch (error: any) {
    report.phases.mysql_query = {
      status: 'failed',
      timeMs: roundMs(queryStart),
      error_code: error.code,
      message: error.message
    }
  } finally {
    if (connection) {
      await connection.end().catch(() => {})
    }
  }

  return report
})