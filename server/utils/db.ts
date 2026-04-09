import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

export const useDB = () => {
  if (!pool) {
    const config = useRuntimeConfig()
    
    // Architectural fix for PROTOCOL_CONNECTION_LOST and Timezone shifts:
    // 1. Connection lifecycle management ensures stability.
    // 2. dateStrings: true prevents the Vercel UTC runtime from converting
    //    naive local database dates into shifted Javascript Date objects.
    pool = mysql.createPool({
      host: config.mysqlHost || 'localhost',
      user: config.mysqlUser || 'root',
      password: config.mysqlPassword || '',
      database: config.mysqlDatabase || 'Sistemas',
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10, // Max idle connections, matching connectionLimit for safe scaling
      idleTimeout: 30000, // Reap connections idle for >30 seconds
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true, // SOLUCIÓN: Devuelve cadenas exactas para evitar desfases horarios en Vercel (UTC)
      timezone: '-06:00' // ALINEACIÓN: Sincroniza la zona horaria base de operaciones nativas
    })

    // Catch and log any stray errors to prevent unhandled process rejections
    pool.on('connection', (connection) => {
      connection.on('error', (err: any) => {
        console.error('MySQL Pool Connection Error:', err.code, err.message)
      })
    })
  }
  
  return pool
}