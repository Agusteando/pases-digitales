import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

export const useDB = () => {
  if (!pool) {
    const config = useRuntimeConfig()
    
    // RESOLUCIÓN ESTRUCTURAL PARA ENTORNO SERVERLESS (VERCEL):
    // La directiva 'maxIdle: 0' provocaba fallos 'connect ETIMEDOUT' al forzar a mysql2 
    // a destruir y crear un nuevo socket TCP por *cada consulta*, agotando rápidamente 
    // los puertos del NAT Gateway en peticiones con múltiples queries.
    //
    // La solución determinista es el uso de 'idleTimeout'. Durante una petición activa, 
    // la conexión se reutiliza al máximo. Al terminar, Vercel congela el contenedor. 
    // Al descongelarse en el futuro, si han transcurrido > 8 segundos, mysql2 detecta 
    // la expiración mediante el reloj del sistema y descarta la conexión "zombie" 
    // de manera segura, abriendo una nueva sin saturar la red.
    pool = mysql.createPool({
      host: config.mysqlHost || 'localhost',
      user: config.mysqlUser || 'root',
      password: config.mysqlPassword || '',
      database: config.mysqlDatabase || 'Sistemas',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 8000, // Cierra conexiones inactivas tras 8s, limpiando zombies tras el thaw
      dateStrings: true, // Previene desfases horarios convirtiendo las fechas nativas a texto
      timezone: '-06:00' // Alineación de zona horaria de base de datos
    })

    // Intercepción de eventos de error en los sockets para prevenir cierres abruptos 
    // del proceso Node debido a desconexiones en segundo plano no controladas.
    pool.on('connection', (connection) => {
      connection.on('error', (err: any) => {
        console.error('MySQL Pool Connection Error (Interceptado):', err.code, err.message)
      })
    })

    pool.on('error', (err: any) => {
      console.error('MySQL Pool Error (Interceptado):', err.code, err.message)
    })
  }
  
  return pool
}