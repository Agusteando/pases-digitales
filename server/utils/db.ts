import mysql from 'mysql2/promise'
import { useRuntimeConfig } from '#imports'

let pool: mysql.Pool | null = null

export const useDB = () => {
  if (!pool) {
    const config = useRuntimeConfig()
    
    // RESOLUCIÓN ESTRUCTURAL PARA ENTORNO SERVERLESS (VERCEL):
    // El fallo subyacente ETIMEDOUT ocurre porque los NAT Gateways cierran silenciosamente
    // las conexiones TCP inactivas sin notificar (sin paquete RST). Al descongelarse la Lambda,
    // mysql2 cree que la conexión sirve, y se cuelga (ETIMEDOUT) intentando retransmitir al vacío.
    //
    // Implementamos 'enableKeepAlive' para enviar latidos TCP que mantengan la tabla NAT viva 
    // y permitan detectar enlaces caídos en capa de red instantáneamente en vez de colgar la aplicación.
    pool = mysql.createPool({
      host: config.mysqlHost || 'localhost',
      user: config.mysqlUser || 'root',
      password: config.mysqlPassword || '',
      database: config.mysqlDatabase || 'Sistemas',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 8000,           // Cierra conexiones inactivas tras 8s, limpiando zombies tras el thaw
      enableKeepAlive: true,       // Activa latidos TCP para evitar desconexiones silenciosas del Firewall
      keepAliveInitialDelay: 10000,// Envía el primer latido después de 10s de inactividad
      connectTimeout: 10000,       // Previene que la aplicación se cuelgue si el servidor está bloqueado
      dateStrings: true,           // Previene desfases horarios convirtiendo las fechas nativas a texto
      timezone: '-06:00'           // Alineación de zona horaria de base de datos
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