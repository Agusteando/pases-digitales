import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { defineEventHandler, setResponseHeader } from '#imports'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  
  const db = useDB()
  try {
    const [rows]: any = await db.execute('SELECT plantel, email, role, puesto FROM hr_directory ORDER BY plantel ASC, role ASC')
    
    const enrichedContacts = await Promise.all(
      rows.map(async (row: any) => {
        const gwData = await getCachedWorkspaceUser(row.email)
        return {
          name: gwData.name,
          email: row.email,
          role: row.role,
          puesto: row.puesto,
          plantel: row.plantel
        }
      })
    )

    const directory = enrichedContacts.reduce((acc: any, curr: any) => {
      if (!acc[curr.plantel]) acc[curr.plantel] = []
      acc[curr.plantel].push(curr)
      return acc
    }, {})
    
    return directory
  } catch (error) {
    console.error('Public Directory fetch error:', error)
    return {}
  }
})