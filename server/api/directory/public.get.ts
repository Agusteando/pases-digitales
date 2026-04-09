import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, setResponseHeader, createError } from '#imports'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  
  try {
    const db = useDB()
    const [rows]: any = await db.execute('SELECT plantel, email, role, puesto FROM hr_directory ORDER BY plantel ASC, role ASC')
    
    const enrichedContacts = await Promise.all(
      rows.map(async (row: any) => {
        const gwData = await getCachedWorkspaceUser(row.email)
        return {
          name: gwData.name,
          email: row.email,
          role: row.role,
          puesto: row.puesto,
          plantel: cleanPlantelName(row.plantel)
        }
      })
    )

    const directory = enrichedContacts.reduce((acc: any, curr: any) => {
      const p = curr.plantel || 'General'
      if (!acc[p]) acc[p] = []
      acc[p].push(curr)
      return acc
    }, {})
    
    return directory
  } catch (error) {
    console.error('Public Directory fetch error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al procesar el directorio público de responsables.' })
  }
})