import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { useRuntimeConfig, defineEventHandler, readBody, setCookie, createError } from '#imports'
import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const client = new OAuth2Client(config.googleClientId)
  const db = useDB()

  try {
    if (!body.credential) {
      throw new Error('Credential missing')
    }

    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: config.googleClientId
    })
    
    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      throw new Error('Invalid payload')
    }

    // Safely extract and coalesce optional fields to prevent undefined bind errors
    const email = payload.email.trim()
    const name = payload.name ? payload.name.trim() : email.split('@')[0]
    const picture = payload.picture ? payload.picture.trim() : null
    
    // Explicit admin bootstrap for exact recovery email
    const isMasterAdmin = email.toLowerCase() === 'desarrollo.tecnologico@casitaiedis.edu.mx' ? 1 : 0

    // Upsert into System Users Table to auto-create any authenticated user
    // Only master admin auto-overwrites is_admin flag back to 1 on login
    await db.execute(`
      INSERT INTO system_users (email, name, picture, last_login, is_admin) 
      VALUES (?, ?, ?, NOW(), ?) 
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        picture = VALUES(picture), 
        last_login = NOW(),
        is_admin = IF(email = 'desarrollo.tecnologico@casitaiedis.edu.mx', 1, is_admin)
    `, [email, name, picture, isMasterAdmin])

    const token = jwt.sign({ 
      email: email, 
      name: name, 
      picture: picture 
    }, config.jwtSecret, { expiresIn: '12h' })

    setCookie(event, 'auth-token', token, {
      path: '/',
      maxAge: 60 * 60 * 12,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    throw createError({ statusCode: 401, message: 'Authentication failed' })
  }
})