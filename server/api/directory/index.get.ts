import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(async () => {
  try {
    const db = useDB()
    const [rows]: any = await db.execute('SELECT id, plantel, email, role, channel FROM hr_directory ORDER BY plantel ASC, role ASC')
    
    const enrichedContacts = await Promise.all(
      rows.map(async (row: any) => {
        const gwData = await getCachedWorkspaceUser(row.email)
        return {
          id: row.id,
          plantel: cleanPlantelName(row.plantel),
          email: row.email,
          role: row.role,
          channel: row.channel || 'EMAIL',
          gw: gwData
        }
      })
    )

    return enrichedContacts
  } catch (error) {
    console.error('Directory fetch error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al recuperar el directorio de responsables.' })
  }
})