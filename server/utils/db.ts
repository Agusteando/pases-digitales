import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

export const useDB = () => {
  if (!pool) {
    const config = useRuntimeConfig()
    
    // RESOLUCIÓN ESTRUCTURAL PARA ENTORNO SERVERLESS (VERCEL):
    // Vercel congela el contenedor en reposo, provocando que los sockets TCP de MySQL 
    // mueran en el servidor sin que el proceso Node se entere. Al descongelarse, 
    // el pool intenta reutilizar un socket muerto generando un ETIMEDOUT irremediable.
    // Configurar 'maxIdle: 0' fuerza al pool a cerrar el socket TCP inmediatamente 
    // después de liberar la conexión, garantizando que cada consulta levante un socket 
    // fresco y eliminando por completo los fallos por estado latente corrupto.
    pool = mysql.createPool({
      host: config.mysqlHost || 'localhost',
      user: config.mysqlUser || 'root',
      password: config.mysqlPassword || '',
      database: config.mysqlDatabase || 'Sistemas',
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 0, // <--- Directiva clave: Cierra las conexiones inmediatamente tras su uso.
      queueLimit: 0,
      dateStrings: true, // Previene desfases horarios convirtiendo las fechas nativas a texto.
      timezone: '-06:00' // Alineación de zona horaria de base de datos.
    })

    // Intercepción de eventos de error en los sockets para prevenir cierres abruptos del proceso.
    pool.on('connection', (connection) => {
      connection.on('error', (err: any) => {
        console.error('MySQL Pool Connection Error:', err.code, err.message)
      })
    })
  }
  
  return pool
}