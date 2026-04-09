import { useDB } from '~/server/utils/db'
import { getCachedWorkspaceUser } from '~/server/utils/googleWorkspace'
import { defineEventHandler, createError } from '#imports'

export default defineEventHandler(async () => {
  try {
    const db = useDB()
    const [users]: any = await db.execute('SELECT email, name, picture, role, last_login, is_admin FROM system_users ORDER BY last_login DESC')
    
    const [emissions]: any = await db.execute('SELECT user as name, COUNT(*) as count FROM hr_entries GROUP BY user')
    const [authorizations]: any = await db.execute('SELECT authorized_by as name, COUNT(*) as count FROM hr_entries WHERE authorized_by IS NOT NULL GROUP BY authorized_by')

    const emitMap = emissions.reduce((acc: any, row: any) => { acc[row.name] = row.count; return acc }, {})
    const authMap = authorizations.reduce((acc: any, row: any) => { acc[row.name] = row.count; return acc }, {})

    const enrichedUsers = await Promise.all(
      users.map(async (u: any) => {
        const gw = await getCachedWorkspaceUser(u.email)
        return {
          ...u,
          picture: gw.photoUrl || u.picture,
          is_admin: Boolean(u.is_admin),
          passesGenerated: emitMap[u.name] || 0,
          passesAuthorized: authMap[u.name] || 0
        }
      })
    )

    return enrichedUsers
  } catch (error) {
    console.error('Users stats error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al recuperar los perfiles y estadísticas de usuarios.' })
  }
})