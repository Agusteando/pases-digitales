import { google } from 'googleapis'
import { LRUCache } from 'lru-cache'
import { useRuntimeConfig } from '#imports'

const userCache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 60 }) // 1 hour cache

let adminClient: any = null

function getAdminClient() {
  if (adminClient) return adminClient

  const config = useRuntimeConfig()
  
  if (!config.googleSaClientEmail || !config.googleSaPrivateKey) {
    console.warn('Google Workspace Service Account credentials missing.')
    return null
  }

  const auth = new google.auth.JWT({
    email: config.googleSaClientEmail,
    key: config.googleSaPrivateKey.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.user.readonly'
    ],
    subject: config.googleWorkspaceAdminEmail
  })

  adminClient = google.admin({ version: 'directory_v1', auth })
  return adminClient
}

export async function getWorkspaceUser(email: string) {
  try {
    const admin = getAdminClient()
    if (!admin) return { name: email.split('@')[0], photoUrl: null, phone: '', email }

    const res = await admin.users.get({ userKey: email, projection: 'full' })
    const user = res.data
    
    let phone = ''
    if (user.phones && user.phones.length > 0) {
      phone = user.phones[0].value || ''
    }

    return {
      name: user.name?.fullName || email,
      photoUrl: user.thumbnailPhotoUrl || null,
      phone: phone,
      email: email
    }
  } catch (e) {
    console.error(`Failed to fetch GW user ${email}`, e)
    return { name: email.split('@')[0], photoUrl: null, phone: '', email }
  }
}

export async function getCachedWorkspaceUser(email: string) {
  if (userCache.has(email)) {
    return userCache.get(email)
  }
  const user = await getWorkspaceUser(email)
  userCache.set(email, user)
  return user
}

export async function updateWorkspaceUserPhone(email: string, newPhone: string) {
  try {
    const admin = getAdminClient()
    if (!admin) throw new Error('Admin client not configured.')

    await admin.users.update({
      userKey: email,
      requestBody: {
        phones: [{ value: newPhone, type: 'work' }]
      }
    })
    
    // Invalidate Cache to ensure immediate UI sync
    userCache.delete(email)
    return true
  } catch (e) {
    console.error(`Failed to update GW phone for ${email}`, e)
    throw e
  }
}