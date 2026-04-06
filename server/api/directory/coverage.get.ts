import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery } from '#imports'

export default defineEventHandler(async (event) => {
  const rawPlantel = getQuery(event).plantel as string
  
  // Enforce consistent cleaning to match the database records exactly
  const plantel = cleanPlantelName(rawPlantel)
  if (!plantel || plantel === 'N/A') return { isComplete: true }

  const db = useDB()
  const [rows]: any = await db.execute('SELECT id, email, role FROM hr_directory WHERE plantel = ?', [plantel])

  const directors = rows.filter((r: any) => r.role === 'Director')
  const admins = rows.filter((r: any) => r.role === 'Administrador')

  const checkGroup = async (group: any[], roleName: string) => {
    if (group.length === 0) return { missing: true, needsPhone: false }
    
    for (const member of group) {
      const gw = await getCachedWorkspaceUser(member.email)
      const phoneDigits = (gw.phone || '').replace(/\D/g, '')
      if (phoneDigits.length >= 10) {
        return { complete: true }
      }
    }
    
    // Pick the first one if all lack phones
    const first = group[0]
    const gw = await getCachedWorkspaceUser(first.email)
    return { 
      missing: false, 
      needsPhone: true, 
      id: first.id, 
      email: first.email, 
      name: gw.name, 
      photoUrl: gw.photoUrl 
    }
  }

  // Evaluates strictly in deterministic order: 1. Director, 2. Administrador
  const dirStatus = await checkGroup(directors, 'Director')
  if (!dirStatus.complete) {
    if (dirStatus.missing) return { isComplete: false, step: 'DIRECTOR_MISSING', role: 'Director' }
    return { isComplete: false, step: 'DIRECTOR_PHONE', role: 'Director', context: dirStatus }
  }

  const admStatus = await checkGroup(admins, 'Administrador')
  if (!admStatus.complete) {
    if (admStatus.missing) return { isComplete: false, step: 'ADMIN_MISSING', role: 'Administrador' }
    return { isComplete: false, step: 'ADMIN_PHONE', role: 'Administrador', context: admStatus }
  }

  return { isComplete: true }
})