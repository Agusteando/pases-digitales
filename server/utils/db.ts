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

let dbClient: DBClient | null = null

function getConnectionConfig(): mysql.ConnectionOptions {
  const config = useRuntimeConfig()

  return {
    host: config.mysqlHost || 'localhost',
    user: config.mysqlUser || 'root',
    password: config.mysqlPassword || '',
    database: config.mysqlDatabase || 'Sistemas',
    connectTimeout: 5000,
    dateStrings: true,
    timezone: '-06:00'
  }
}

async function runWithFreshConnection<T extends mysql.QueryResult>(
  method: 'execute' | 'query',
  sql: string,
  params?: QueryParams
): Promise<[T, mysql.FieldPacket[]]> {
  const connection = await mysql.createConnection(getConnectionConfig())

  try {
    if (method === 'query') {
      return await connection.query<T>(sql, params as any)
    }

    return await connection.execute<T>(sql, params as any)
  } finally {
    try {
      await connection.end()
    } catch (error: any) {
      console.error('MySQL connection close error:', error?.code || error?.message || error)
    }
  }
}

export const useDB = (): DBClient => {
  if (!dbClient) {
    dbClient = {
      execute<T extends mysql.QueryResult = mysql.QueryResult>(
        sql: string,
        params?: QueryParams
      ) {
        return runWithFreshConnection<T>('execute', sql, params)
      },

      query<T extends mysql.QueryResult = mysql.QueryResult>(
        sql: string,
        params?: QueryParams
      ) {
        return runWithFreshConnection<T>('query', sql, params)
      }
    }
  }

  return dbClient
}