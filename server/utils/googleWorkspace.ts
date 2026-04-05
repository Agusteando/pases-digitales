import { google } from 'googleapis'
import { LRUCache } from 'lru-cache'
import { useRuntimeConfig } from '#imports'

const userCache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 60 }) // 1 hour cache
const photoCache = new LRUCache<string, string | null>({ max: 500, ttl: 1000 * 60 * 60 * 24 }) // 24 hour cache

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

/**
 * Fetches the actual profile picture binary data from the Google Admin Directory API.
 * Converts the returned websafe Base64 into a standard Base64 data URI for immediate UI consumption.
 */
export async function getWorkspaceUserPhoto(email: string): Promise<string | null> {
  if (photoCache.has(email)) return photoCache.get(email) || null

  try {
    const admin = getAdminClient()
    if (!admin) return null

    const photoRes = await admin.users.photos.get({ userKey: email })
    
    if (photoRes.data && photoRes.data.photoData) {
      const mimeType = photoRes.data.mimeType || 'image/jpeg'
      // The API returns websafe base64 (using '-' and '_'). We must replace them for a valid data URI.
      const base64 = photoRes.data.photoData.replace(/-/g, '+').replace(/_/g, '/')
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      photoCache.set(email, dataUrl)
      return dataUrl
    }
  } catch (e: any) {
    // A 404 indicates the user does not have a custom profile picture. 
    // We cache the null result to avoid spamming the API on subsequent renders.
    photoCache.set(email, null)
    return null
  }
  
  return null
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

    // Resolve the real binary photo representation from Workspace
    const photoDataUrl = await getWorkspaceUserPhoto(email)

    return {
      name: user.name?.fullName || email,
      photoUrl: photoDataUrl,
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
    
    // Invalidate Cache to ensure immediate UI sync reflection
    userCache.delete(email)
    return true
  } catch (e) {
    console.error(`Failed to update GW phone for ${email}`, e)
    throw e
  }
}

export async function searchWorkspaceUsers(query: string) {
  try {
    const admin = getAdminClient()
    if (!admin) return []
    const res = await admin.users.list({
      customer: 'my_customer',
      query: query,
      maxResults: 15,
      viewType: 'domain_public'
    })
    
    const users = res.data.users || []
    
    // Enrich all search results concurrently with real photo data so the dropdown feels high-fidelity
    const enrichedUsers = await Promise.all(users.map(async (u: any) => {
      const email = u.primaryEmail
      const photoUrl = await getWorkspaceUserPhoto(email)
      
      return {
        email: email,
        name: u.name?.fullName || email,
        photoUrl: photoUrl
      }
    }))

    return enrichedUsers
  } catch (e) {
    console.error(`Failed to search GW users for ${query}`, e)
    return []
  }
}