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
  
  // Return a robust wrapper that automatically handles connection drops (PROTOCOL_CONNECTION_LOST)
  // transparently across the entire application without needing to change endpoint logic.
  return {
    execute: async (sql: string, values?: any[]) => {
      let retries = 3;
      while (retries > 0) {
        try {
          return await pool!.execute(sql, values);
        } catch (err: any) {
          const isRecoverable = err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR';
          if (isRecoverable && retries > 1) {
            console.warn(`MySQL Connection lost (${err.code}). Retrying query... (${retries - 1} attempts left)`);
            retries--;
            await new Promise(res => setTimeout(res, 250)); // Fast exponential backoff
            continue;
          }
          throw err;
        }
      }
    },
    query: async (sql: string, values?: any[]) => {
      let retries = 3;
      while (retries > 0) {
        try {
          return await pool!.query(sql, values);
        } catch (err: any) {
          const isRecoverable = err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR';
          if (isRecoverable && retries > 1) {
            console.warn(`MySQL Connection lost (${err.code}). Retrying query... (${retries - 1} attempts left)`);
            retries--;
            await new Promise(res => setTimeout(res, 250));
            continue;
          }
          throw err;
        }
      }
    }
  }
}