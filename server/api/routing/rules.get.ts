import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { isPersonRuleValue } from '~/server/utils/authorizationRules'
import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(async () => {
  try {
    const db = useDB()
    const [rows]: any = await db.execute('SELECT * FROM notification_rules ORDER BY id DESC')
    
    const visibleRows = rows.filter((r: any) => !isPersonRuleValue(r.condition_plantel))
    const enriched = await Promise.all(visibleRows.map(async (r: any) => {
      let finalRule = { ...r, condition_plantel: cleanPlantelName(r.condition_plantel) || 'ALL' }
      if (r.target_type === 'CONTACT') {
         const gw = await getCachedWorkspaceUser(r.target_val)
         return { 
           ...finalRule, 
           channel: r.channel || 'EMAIL',
           gw_name: gw.name, 
           gw_photo: gw.photoUrl 
         }
      }
      return finalRule
    }))
    
    return enriched
  } catch (error) { 
    console.error('Rules GET error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al recuperar las reglas de enrutamiento.' })
  }
})