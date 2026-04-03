import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { useRuntimeConfig, defineEventHandler, readBody, setCookie, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const client = new OAuth2Client(config.googleClientId)

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

    const token = jwt.sign({ 
      email: payload.email, 
      name: payload.name, 
      picture: payload.picture 
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