import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

export const useDB = () => {
  if (!pool) {
    const config = useRuntimeConfig()
    
    pool = mysql.createPool({
      host: config.mysqlHost || 'localhost',
      user: config.mysqlUser || 'root',
      password: config.mysqlPassword || '',
      database: config.mysqlDatabase || 'Sistemas',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Enable TCP Keep-Alive to prevent the database or firewalls from dropping idle connections
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    })

    // Listen to connection errors on the pool to prevent unhandled rejections
    pool.on('connection', (connection) => {
      connection.on('error', (err: any) => {
        console.error('MySQL Pool Connection Error:', err.code, err.message)
      })
    })
  }
  
  return pool
}