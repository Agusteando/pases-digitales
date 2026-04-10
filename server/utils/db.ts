import dns from 'node:dns/promises'
import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

type QueryParams = any[] | Record<string, any> | undefined

interface DBClient {
  execute<T extends mysql.QueryResult = mysql.QueryResult>(
    sql: string,
    params?: QueryParams
  ): Promise<[T, mysql.FieldPacket[]]>

  query<T extends mysql.QueryResult = mysql.QueryResult>(
    sql: string,
    params?: QueryParams
  ): Promise<[T, mysql.FieldPacket[]]>
}

let poolPromise: Promise<mysql.Pool> | null = null
let dbClient: DBClient | null = null

function isIPv4(value: string): boolean {
  return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value)
}

async function resolveMySQLHost(): Promise<string> {
  const config = useRuntimeConfig()
  const rawHost = String(config.mysqlHost || 'localhost').trim()

  if (!rawHost || rawHost === 'localhost') {
    return '127.0.0.1'
  }

  if (isIPv4(rawHost)) {
    return rawHost
  }

  const { address } = await dns.lookup(rawHost, { family: 4 })
  return address
}

async function createPool(): Promise<mysql.Pool> {
  const config = useRuntimeConfig()
  const host = await resolveMySQLHost()

  return mysql.createPool({
    host,
    port: Number(config.mysqlPort || 3306),
    user: config.mysqlUser || 'root',
    password: config.mysqlPassword || '',
    database: config.mysqlDatabase || 'Sistemas',
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
    connectTimeout: 15000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    dateStrings: true,
    timezone: '-06:00'
  })
}

async function getPool(): Promise<mysql.Pool> {
  if (!poolPromise) {
    poolPromise = createPool().catch((error) => {
      poolPromise = null
      throw error
    })
  }

  return poolPromise
}

async function resetPool(): Promise<void> {
  if (!poolPromise) return

  try {
    const pool = await poolPromise
    await pool.end()
  } catch {
    // Ignore pool shutdown errors
  } finally {
    poolPromise = null
  }
}

function shouldResetPool(error: any): boolean {
  return [
    'ETIMEDOUT',
    'ECONNRESET',
    'EPIPE',
    'PROTOCOL_CONNECTION_LOST'
  ].includes(error?.code)
}

async function run<T extends mysql.QueryResult>(
  method: 'execute' | 'query',
  sql: string,
  params?: QueryParams
): Promise<[T, mysql.FieldPacket[]]> {
  const pool = await getPool()

  try {
    if (method === 'query') {
      return await pool.query<T>(sql, params as any)
    }

    return await pool.execute<T>(sql, params as any)
  } catch (error: any) {
    if (shouldResetPool(error)) {
      await resetPool()
    }

    throw error
  }
}

export const useDB = (): DBClient => {
  if (!dbClient) {
    dbClient = {
      execute<T extends mysql.QueryResult = mysql.QueryResult>(
        sql: string,
        params?: QueryParams
      ) {
        return run<T>('execute', sql, params)
      },

      query<T extends mysql.QueryResult = mysql.QueryResult>(
        sql: string,
        params?: QueryParams
      ) {
        return run<T>('query', sql, params)
      }
    }
  }

  return dbClient
}