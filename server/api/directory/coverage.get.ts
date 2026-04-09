import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const rawPlantel = getQuery(event).plantel as string
  
  const plantel = cleanPlantelName(rawPlantel)
  if (!plantel || plantel === 'N/A') return { isComplete: true }

  try {
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
  } catch (error: any) {
    console.error('Directory coverage error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al verificar la cobertura operativa en la base de datos.' })
  }
})