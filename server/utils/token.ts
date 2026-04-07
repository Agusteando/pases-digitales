import crypto from 'crypto'
import { useRuntimeConfig } from '#imports'

export function signRecipientToken(email: string, name: string): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret || 'fallback-secret'
  
  // Create a minimal unpadded base64url payload
  const payload = Buffer.from(`${email}|${name}`, 'utf-8').toString('base64url')
  
  // Create a short 16-character HMAC signature for integrity
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url').substring(0, 16)
  
  return `${payload}.${sig}`
}

export function verifyRecipientToken(token: string): { email: string, name: string } | null {
  try {
    const config = useRuntimeConfig()
    const secret = config.jwtSecret || 'fallback-secret'
    
    const [payload, sig] = token.split('.')
    if (!payload || !sig) return null
    
    // Verify signature
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url').substring(0, 16)
    if (sig !== expectedSig) return null
    
    // Decode payload
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
    const parts = decoded.split('|')
    if (parts.length < 2) return null
    
    const email = parts[0]
    const name = parts.slice(1).join('|')
    
    return { email, name }
  } catch (e) {
    return null
  }
}