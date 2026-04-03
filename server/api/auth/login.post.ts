import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { useRuntimeConfig, defineEventHandler, readBody, setCookie, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const client = new OAuth2Client(config.googleClientId)

  try {
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: config.googleClientId
    })
    const payload = ticket.getPayload()
    
    // In production, you would check `payload.email` against your allowed HR list.
    const token = jwt.sign({ 
      email: payload.email, 
      name: payload.name, 
      picture: payload.picture 
    }, config.jwtSecret, { expiresIn: '12h' })

    setCookie(event, 'auth-token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 12
    })

    return { success: true }
  } catch (error) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }
})