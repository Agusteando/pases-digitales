import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const db = useDB()
  
  try {
    const [rows]: any = await db.execute('SELECT id, plantel, email, role FROM hr_directory ORDER BY plantel ASC, role ASC')
    
    // Enrich DB records with identity and visual data from Google Workspace concurrently
    const enrichedContacts = await Promise.all(
      rows.map(async (row: any) => {
        const gwData = await getCachedWorkspaceUser(row.email)
        return {
          id: row.id,
          plantel: row.plantel,
          email: row.email,
          role: row.role,
          gw: gwData
        }
      })
    )

    return enrichedContacts
  } catch (error) {
    console.error('Directory fetch error:', error)
    return []
  }
})