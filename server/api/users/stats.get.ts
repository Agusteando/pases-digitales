import { useDB } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const db = useDB()
  
  try {
    const [users]: any = await db.execute('SELECT email, name, picture, role, last_login, is_admin FROM system_users ORDER BY last_login DESC')
    
    // Calculate stats per user
    const [emissions]: any = await db.execute('SELECT user as name, COUNT(*) as count FROM hr_entries GROUP BY user')
    const [authorizations]: any = await db.execute('SELECT authorized_by as name, COUNT(*) as count FROM hr_entries WHERE authorized_by IS NOT NULL GROUP BY authorized_by')

    const emitMap = emissions.reduce((acc: any, row: any) => { acc[row.name] = row.count; return acc }, {})
    const authMap = authorizations.reduce((acc: any, row: any) => { acc[row.name] = row.count; return acc }, {})

    return users.map((u: any) => ({
      ...u,
      is_admin: Boolean(u.is_admin),
      passesGenerated: emitMap[u.name] || 0,
      passesAuthorized: authMap[u.name] || 0
    }))

  } catch (error) {
    console.error('Users stats error:', error)
    return []
  }
})