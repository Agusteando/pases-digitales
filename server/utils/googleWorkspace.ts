import { google } from 'googleapis'
import { LRUCache } from 'lru-cache'
import { useRuntimeConfig } from '#imports'

const userCache = new LRUCache<string, any>({ max: 200, ttl: 1000 * 60 * 60 }) 
const photoCache = new LRUCache<string, string | null>({ max: 500, ttl: 1000 * 60 * 60 * 24 }) 

let adminClient: any = null
let gmailClient: any = null

function getGoogleAuthClient() {
  const config = useRuntimeConfig()
  
  if (!config.googleSaClientEmail || !config.googleSaPrivateKey) {
    console.warn('Google Workspace Service Account credentials missing.')
    return null
  }

  return new google.auth.JWT({
    email: config.googleSaClientEmail,
    key: config.googleSaPrivateKey.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ],
    subject: config.googleWorkspaceAdminEmail
  })
}

function getAdminClient() {
  if (adminClient) return adminClient
  const auth = getGoogleAuthClient()
  if (!auth) return null
  adminClient = google.admin({ version: 'directory_v1', auth })
  return adminClient
}

export function getGmailClient() {
  if (gmailClient) return gmailClient
  const auth = getGoogleAuthClient()
  if (!auth) return null
  gmailClient = google.gmail({ version: 'v1', auth })
  return gmailClient
}

export async function sendWorkspaceEmail(to: string, subject: string, htmlBody: string) {
  const gmail = getGmailClient()
  const config = useRuntimeConfig()

  if (!gmail) {
    console.warn('Gmail client not initialized. Ensure SA credentials are correct.')
    return false
  }

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
  const messageParts = [
    `From: "Pases Digitales" <${config.googleWorkspaceAdminEmail}>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    '',
    htmlBody
  ]
  const emailStr = messageParts.join('\r\n')
  const encodedEmail = Buffer.from(emailStr).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail }
    })
    return true
  } catch (error) {
    console.error('Failed to send Workspace Email:', error)
    throw error
  }
}

export async function getWorkspaceUserPhoto(email: string): Promise<string | null> {
  if (photoCache.has(email)) return photoCache.get(email) || null

  try {
    const admin = getAdminClient()
    if (!admin) return null

    const photoRes = await admin.users.photos.get({ userKey: email })
    
    if (photoRes.data && photoRes.data.photoData) {
      const mimeType = photoRes.data.mimeType || 'image/jpeg'
      const base64 = photoRes.data.photoData.replace(/-/g, '+').replace(/_/g, '/')
      const dataUrl = `data:${mimeType};base64,${base64}`
      
      photoCache.set(email, dataUrl)
      return dataUrl
    }
  } catch (e: any) {
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
  if (userCache.has(email)) return userCache.get(email)
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
    
    // Ensure optimistic cache updates to prevent immediate re-reads 
    // from triggering infinite onboarding loops before Workspace APIs fully propagate.
    const existing = userCache.get(email) || { name: email.split('@')[0], photoUrl: null, email }
    userCache.set(email, { ...existing, phone: newPhone })
    
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
    
    const enrichedUsers = await Promise.all(users.map(async (u: any) => {
      const email = u.primaryEmail
      const photoUrl = await getWorkspaceUserPhoto(email)
      let phone = ''
      if (u.phones && u.phones.length > 0) {
        phone = u.phones[0].value || ''
      }
      
      return {
        email: email,
        name: u.name?.fullName || email,
        photoUrl: photoUrl,
        phone: phone
      }
    }))

    return enrichedUsers
  } catch (e) {
    console.error(`Failed to search GW users for ${query}`, e)
    return []
  }
}