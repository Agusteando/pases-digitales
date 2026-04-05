import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const db = useDB()
  try {
    const [rows]: any = await db.execute('SELECT * FROM notification_rules ORDER BY id DESC')
    
    const enriched = await Promise.all(rows.map(async (r: any) => {
      if (r.target_type === 'CONTACT') {
         const gw = await getCachedWorkspaceUser(r.target_val)
         return { ...r, gw_name: gw.name, gw_photo: gw.photoUrl }
      }
      return r
    }))
    
    return enriched
  } catch (e) { 
    console.error('Rules GET error:', e)
    return [] 
  }
})